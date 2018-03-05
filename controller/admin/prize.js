/**
 * ============================
 * 抽奖设置
 */
"use strict";

var config = require('../../config');
var qr = require('../../lib/qr');
var util = require('../../lib/util');
var model = require('../../model');
var User = model.User;
var PrizeSetup = model.PrizeSetup;
var PrizeRecord = model.PrizeRecord;
var prize_manager = require('../../lib/prize_manager');	
var quick_pre_setups = require('../../config/prize.json');

// 抽奖结果渲染
exports.index = function(req, res) {
	return PrizeRecord.find().then(function(records) {
		var uids = [];
		for (let record of records) {
			uids = uids.concat(record.uids);
		}

		return User.find({
			_id: {
				$in: uids
			}
		}).then(function(users_data) {
			var rounds = new Map();
			for (let record of records) {
				var round = rounds.get(record.round);
				if (!round) {
					round = {
						round: record.round,
						count: 0,
						name: record.name,
						records: []
					}
				}

				if (!round.time || record.time < round.time) {
					round.time = record.time;
				}

				var users = [];
				for (let uid of record.uids) {
					users.push(util.find(users_data, uid, 'id'));
				}

				round.records.push({
					id: record.id,
					users: users,
					time: record.time,
					is_deleted: record.is_deleted
				});
				round.count += users.length;

				// 自动排序
				rounds.set(round.round, round);
			}

			rounds = rounds.values();
			var ret_rounds = [];
			for (let item of rounds) {
				ret_rounds.push(item);
			}

			return {
				title: "抽奖",
				has_rounds: !!ret_rounds.length,
				rounds: ret_rounds.sort(function(a, b) {
					return a.time - b.time;
				})
			}
		});
	});
}

exports.delete = function(req, res) {
	var id = req.data.id;
	return PrizeRecord.findOneAndUpdate(
		{_id: id }, 
		{
			$set: {
				is_deleted: true
			}
		},
		{new: true}
	).then(function() {
		return true;
	});
}

// 抽奖设置渲染
exports.setup = function(req, res) {
	return PrizeSetup.findOne().then(function(setup) {
		return {
			title: "抽奖设置",
			round: (setup && setup.round || 0) + 1
		}
	});
}

// 抽奖配置保存
exports.setup_save = function(req, res) {
	var type = +req.data.type;
	var count = +req.data.count;
	var limit = +req.data.limit;
	var name = req.data.name;

	if (prize_manager.running) {
		return Promise.reject("请先等待当前抽奖结束再开始下一轮");
	}

	return PrizeSetup.findOne().then(function(setup) {
		if (!setup) {
			setup = new PrizeSetup({
				round: 0
			});
		}

		setup.round += 1;
		setup.count = count;
		setup.type = type;
		setup.limit = limit;
		setup.name = name;

		return setup.save();
	}).then(function(setup) {

		// 通知切换到抽奖页面
		res.broadcast('_server_push_/screen_redirect', {page: config.host + '/prize/index'});
		return setup.toJSON();
	});
}

// 快速开始
exports.quick = function(req, res) {
	return PrizeRecord.find({
		is_deleted: false
	}).then(function(records) {
		for (let setup of quick_pre_setups) {
			let round = setup.round;
			let limit = setup.type === 1 ? 1 : setup.limit;
			// 当前轮已中奖的人数
			var prized = 0;
			var phase = 0;
			for (let record of records) {
				if (record.round === round) {
					phase++;
					prized += record.uids.length;
				}
			}
			// 已抽取人数
			setup.prized = prized;
			// 阶段
			setup.phase = phase;
			// 总的阶段
			setup.phase_total = Math.ceil(setup.count / limit);
			// 已结束
			setup.end = prized >= setup.count;
		}

		return {
			title: "抽奖快速配置",
			rounds: quick_pre_setups
		};
	});
}

// 快速开始保存
exports.quick_start = function(req, res) {
	var round = +req.data.round;
	var round_setup = util.find(quick_pre_setups, round, 'round');

	if (!round_setup) {
		return "未知的预定义抽奖轮次";
	}

	var limit = round_setup.type === 1 ? 1 : round_setup.limit;

	return PrizeSetup.findOneAndUpdate(
		{},
		{
			$set: {
				type: round_setup.type,
				name: round_setup.name,
				round: round_setup.round,
				count: round_setup.count,
				limit: limit,
				ticket: util.token(20)
			}
		},
		{upsert: true, new: true}
	).then(function(setup) {
		// 通知切换到抽奖页面
		res.broadcast('_server_push_/screen_redirect', {page: config.host + '/prize/index'});

		// 延时2s再跳转，防止页面还未加载完成
		setTimeout(function() {
			var url = config.host + '/' + config.admin_uri + '/prize/';
			url += (setup.type == 1) ? 'ctrl_single' : 'ctrl_batch';
			url += '?ticket=' + setup.ticket;
			res.redirect(302,  url);
		}, 2e3);
	});
}


// 抽奖批量开始页面渲染
exports.ctrl_batch = function(req, res) {
	return {
		title: '舜飞2018年度晚宴-抽奖',
		ticket: req.data.ticket,
		running: prize_manager.running
	};
}

// 抽奖单轮开始页面渲染
exports.ctrl_single = function(req, res) {
	return {
		title: '舜飞2018年度晚宴-抽奖',
		ticket: req.data.ticket,
		running: prize_manager.running
	};
}


// 批量抽奖接口
exports.draw_batch = function(req, res) {
	// 开始抽奖
	return prize_manager.m_take(req.data.ticket);
}

// 单个抽奖接口
exports.draw_single = function(req, res) {
	var status = req.data.status;
	if (status){
		// 开始抽奖
		return prize_manager.s_start(req.data.ticket);
	} else {
		// 结束抽奖
		return prize_manager.s_stop(req.data.ticket);
	}
}

// 推送某一轮中奖结果到大屏
exports.push_result = function(req, res) {
	var round = +req.data.round;
	return PrizeRecord.find({
		round: round,
		is_deleted: false
	}).then(function(records) {
		var uids = [];
		for (let record of records) {
			uids = uids.concat(record.uids);
		}

		return User.find({
			_id: {
				$in: uids
			}
		}).then(function(users_data) {
			var prized_users = [];

			for (let record of records) {
				for (let uid of record.uids) {
					prized_users.push(util.find(users_data, uid, 'id'));
				}
			}
			
			res.broadcast('_server_push_/prize_result_users', {
				users: prized_users
			});

			return true;
		});
	});
}


exports.unpush_result = function(req, res) {
	res.broadcast('_server_push_/prize_result_hide');
	return true;
}

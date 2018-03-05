/**
 * ============================
 * 抽奖控制中心
 */
"use strict";


var EventEmitter = require('events').EventEmitter;
var model = require('../model/index');
var socket = require('./socket');
var util = require('./util');
var User = model.User;
var PrizeSetup = model.PrizeSetup;
var PrizeRecord = model.PrizeRecord;

function PrizeManager() {
	EventEmitter.call(this);
	this.running = false;
	// 上次抽奖时间
	this.last_time = 0;
	// 两次抽奖间隔, 20s
	this.duration = 20;

	var _this = this;

	this.on('s_start', function(params) {
		// 通知大屏播动画
		socket.broadcast('_server_push_/prize_s_start', {
			round: params[0]
		});
	});

	this.on('s_stop', function(params) {
		//_this.last_time = Date.now();
		// 通告大屏中奖者
		socket.broadcast('_server_push_/prize_s_stop', {
			round: params[0],
			uid: params[1]
		});
	});

	this.on('m_take', function(params) {
		//_this.last_time = Date.now();
		// 通知大屏中奖者
		socket.broadcast('_server_push_/prize_m_take', {
			round: params[0],
			uids: params[1]
		});
	});
}

PrizeManager.prototype.pick_lucky = function(all_users, records, num, round, count) {
	var self = this;

	// 合并已经中间的人员ID
	var all_lucker = [];
	var round_count = 0;
	for (let record of records) {
		all_lucker = all_lucker.concat(record.uids);
		if (record.round == round) {
			round_count += record.uids.length;
		}
	}

	if (round_count >= count) {
		throw "当前轮次奖品已被抽完！";
	}

	// 计算可参与抽奖的人数
	var involed_uids = [];
	for (let user of all_users) {
		user = user._id.toString();
		if (all_lucker.indexOf(user) == -1) {
			involed_uids.push(user);
		}
	}

	// 修正还可以抽奖的人数
	num = Math.min(num, count - round_count);
	if (involed_uids.length < num) {
		throw "参与抽奖的人数不能少于剩余奖品数!";
	}

	// 随机抽取中奖用户
	var prize_uids = [];
	while (num-->0) {
		let id = involed_uids.splice(
			Math.floor(Math.random() * involed_uids.length),
			1
		);
		prize_uids.push(id[0]);
	}
	return prize_uids;
};

// 单个开始
PrizeManager.prototype.s_start = function(ticket) {
	if (this.running) {
		return Promise.reject("正在进行中");
	}

	if (Date.now() - this.last_time < this.duration * 1e3) {
		return Promise.reject("两次抽奖间隔需要" + this.duration + "秒以上");
	}

	this.running = true;

	var _this = this;
	return Promise.all([
		PrizeSetup.findOne({ ticket: ticket}),
		PrizeRecord.find({is_deleted: false})
	]).then(function(values) {
		var setup = values[0];
		var records = values[1];
		
		var count = setup.count;
		var round = setup.round;
		// 当前轮已中奖的人数
		var current_round_prized = [];
		for (let record of records) {
			if (record.round === round) {
				current_round_prized = current_round_prized.concat(record.uids);
			}
		}

		if (current_round_prized.length >= count) {
			_this.running = false;
			return Promise.reject("当前轮次奖品已被抽完！");
		}
		
		if (!setup) {
			_this.running = false;
			return Promise.reject("ticket已失效");
		}

		_this.emit('s_start', [round]);
		return true;
	});
}
// 单个结束
PrizeManager.prototype.s_stop = function(ticket) {

	if (!this.running) {
		return Promise.reject("还未开始呢！");
	}

	var _this = this;
	return PrizeSetup.findOne({
		ticket: ticket
	}).then(function(setup) {
		if (!setup) {
			_this.running = false;
			return Promise.reject("ticket已失效");
		}

		var count = setup.count;
		var round = setup.round;

		return Promise.all([
			// 签到的员工才可以参与抽奖
			User.find({ guest: false, signed: true }),
			PrizeRecord.find({ is_deleted: false })
		]).then(function(values) {
			// 抽取一个用户
			try {
				var lucky_ids = _this.pick_lucky(
					values[0] || [],
					values[1] || [],
					1, round, count
				);
			}
			catch (err) {
				_this.running = false;
				return Promise.reject(err);
			}

			// 保存抽奖结果
			var prize_uid = lucky_ids[0];
			var record = new PrizeRecord({
				round: round,
				name: setup.name,
				time: Date.now(),
				uids: [ prize_uid ]
			});

			return record.save().then(function() {
				_this.running = false;
				_this.emit('s_stop', [round, prize_uid]);
				return true;
			});
		});
	});
}

// 抽奖，批量抽
PrizeManager.prototype.m_take = function(ticket) {
	if (this.running) {
		return Promise.reject("正在进行中");
	}

	if (Date.now() - this.last_time < this.duration * 1e3) {
		return Promise.reject("两次抽奖间隔需要" + this.duration + "秒以上");
	}

	this.running = true;
	var _this = this;
	return PrizeSetup.findOne({
		ticket: ticket
	}).then(function(setup) {
		if (!setup) {
			_this.running = false;
			return Promise.reject("ticket已失效");
		}

		var count = setup.count;
		var round = setup.round;

		return Promise.all([
			// 签到的员工才可以参与抽奖
			User.find({ guest: false, signed: true }),
			PrizeRecord.find({ is_deleted: false })
		]).then(function(values) {
			try {
				var lucky_ids = _this.pick_lucky(
					values[0] || [],
					values[1] || [],
					Math.min(setup.limit, 60), round, count
				);
			}
			catch (err) {
				_this.running = false;
				return Promise.reject(err);
			}

			// 保存抽奖结果
			var record = new PrizeRecord({
				round: round,
				name: setup.name,
				time: Date.now(),
				uids: lucky_ids
			});

			return record.save().then(function() {
				_this.running = false;
				_this.emit('m_take', [round, lucky_ids])
				return true;
			});
		});
	});
}

PrizeManager.prototype.__proto__ = EventEmitter.prototype;

module.exports = new PrizeManager();

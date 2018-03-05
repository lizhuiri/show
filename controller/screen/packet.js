/**
 * ============================
 * 红包
 * 逻辑：
 * 	1、默认进入index，index判断活动状态跳到对应页面
 * 	2、countdown页面红包倒计时结束后自动跳转到红包倒数页面
 * 	3、红包倒数是web端轮询接口：获取状态和剩余红包数，状态为结束则自动跳转到结果页面
 */

'use strict';

var config = require('../../config');
var util = require('../../lib/util');
var packet_manager = require('../../lib/packet_manager');
var model = require('../../model');
var User = model.User;
var PacketUserRecord = model.PacketUserRecord;

// 从packet_manager中获取状态
// 自动跳转页面
function check_redirect(res, self_status) {
	var status = packet_manager.status();

	// 正确的状态则返回result结果
	if (status === self_status) {
		return true;
	}

	if (res.redirect) {
		switch (status) {
			// 红包倒计时
			case 1:
				res.redirect(302, config.host + '/packet/countdown');
				break;
			// 红包进行中(剩余红包倒数)
			case 2:
				res.redirect(302, config.host + '/packet/remain');
				break;
			// 结束
			case 3:
				res.redirect(302, config.host + '/packet/result');
				break;
			default:
				res.redirect(302, config.host + '/packet/oops');
		}
	}

	return false;
}

exports.index = function(req, res) {
	check_redirect(res);
}

// 红包倒计时
exports.countdown = function(req, res, is_websocket) {
	var start_time = packet_manager.get('start_time') || 0;
	if (is_websocket || check_redirect(res, 1)) {
		return {
			title: '舜飞2018年度晚宴-抢红包活动',
			status: packet_manager.status(),
			start_time: start_time,
			countdown: Math.max(0, start_time - Date.now())
		};
	}
}

// 红包倒数
exports.remain = function(req, res, is_websocket){
	// 定时获取剩余红包和状态，状态结束则自动跳转到红包结果页面
	if (is_websocket || check_redirect(res, 2)) {
		return {
			title: '舜飞2018年度晚宴-抢红包活动',
			status: packet_manager.status(),
			remain: packet_manager.get('remain_count') || 0
		};
	}
}

// 红包结果
exports.result = function(req, res) {
	if (check_redirect(res, 3)) {
		return PacketUserRecord.find().sort({amount: -1}).limit(3).then(function(records) {
			var uids = [];
			for (let record of records) {
				uids.push(record.uid);
			}

			return User.find({
				_id: {
					$in: uids
				}
			}).then(function(users_data) {	
				
				var items = [];
				for (let record of records) {
					var user = util.find(users_data, record.uid, 'id');
					var item = {
						amount: record.amount,
						avatar: user && user.avatar,
						guest: user && user.guest,
						name: user && user.name
					};
					items.push(item);
				}
				return {
					title: '舜飞2018年度晚宴-抢红包活动',
					items: items
				};
			});
		});
	}

}

exports.oops = function(req, res) {
	return {
		title: '舜飞2018年度晚宴-抢红包活动'
	};
}
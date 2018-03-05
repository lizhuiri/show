/**
 * ============================
 * 嘉宾签到
 */
'use strict';

var model = require('../../model');
var util = require('../../lib/util');
var User = model.User;
var WxUser = model.WxUser;

exports.list = function(req, res) {
	return{

	}
}

// 刷新嘉宾列表时请求的接口
exports.getData = function(req, res) {
	return User.find({guest: true, signed: true}).then(function(guests){
		var oids = [];
		for (let item of guests) {
			oids.push(item.openid);
		}

		return WxUser.find({
			openid: {
				$in: oids
			}
		}).then(function(wx_users) {
			var items = [];
			for (let guest of guests) {
				let wx_item = util.find(wx_users, guest.openid, 'openid');
				let item = guest.toJSON();
				item.wx_nickname = wx_item && wx_item.nickname;
				item.sign_time_format = util.date(guest.sign_time, 'H:i:s');

				items.push(item);
			}

			return {
				items: items
			}
		});
	});
}



exports.initMessenger = function(req, res) {
	return User.find({guest: true, verified: false, signed: true}).then(function(guests){
		var oids = [];
		for (let item of guests) {
			oids.push(item.openid);
		}

		return WxUser.find({
			openid: {
				$in: oids
			}
		}).then(function(wx_users) {
			var items = [];
			for (let guest of guests) {
				let wx_item = util.find(wx_users, guest.openid, 'openid');
				let item = guest.toJSON();
				item.wx_nickname = wx_item && wx_item.nickname;
				item.sign_time_format = util.date(guest.sign_time, 'H:i:s');

				items.push(item);
			}

			return {
				title: "嘉宾签到列表",
				items: items
			}
		});
	});
}

// 删除
exports.delete = function(req, res) {
	var openid = req.data.openid;

	return User.findOneAndRemove({
		openid: openid
	}).then(function() {
		return {
			openid: openid
		};
	});
}

// 审核通过
exports.trial = function(req, res) {
	var name = req.data.name;
	var openid = req.data.openid;

	return User.findOneAndUpdate(
		{openid: openid},
		{
			$set: {
				name: name,
				verified: true
			}
		},
		{new: true}
	).then(function(user) {
		// 嘉宾签到推送
		res.broadcast('_server_push_/wall_sign_in', user.toJSON());
		return {
			openid: user.openid,
			name: user.name
		};
	});
}
/**
 * ============================
 * 红包设置
 * 红包设置后会给wx和screen发送消息
 * 大屏跳转到倒计时页面
 * wx也会进入后台倒计时
 */
'use strict';

var config = require('../../config');
var default_setup = require('../../config/packet.json');
var model = require('../../model');
var util = require('../../lib/util');
var qr = require('../../lib/qr');
var packet_manager = require('../../lib/packet_manager');
var PacketSetup = model.PacketSetup;
var PacketRecord = model.PacketRecord;
var PacketUserRecord = model.PacketUserRecord;
var User = model.User;
// 抢红包记录
exports.record = function(req, res) {
	var page = Number(req.data.page || 1);
	var limit = 100;
	var pages = 0;
	var pageAry = [];

	return PacketRecord.count().then(function(count) {

		// 总页数
		pages = Math.ceil(count / limit);
		// page不超过pages且大于1
		page = Math.min(page, pages);
		page = Math.max(page, 1);

		for (let i = 0; i < pages; i++) {
			pageAry.push(i);
		}

		var skip = (page - 1) * limit;

		// 返回聚合后的结果
		return PacketRecord.find({}, null, {
			sort: {
				time: 1
			}
		}).limit(limit).skip(skip).then(function(records) {
			var uids = [];
			for (let record of records) {
				uids.push(record.uid);
			}

			return User.find({
				_id: {
					$in: uids
				}
			}).then(function(users_data) {
				// 重新设置聚合后的用户信息
				for (let record of records) {
					var user = util.find(users_data, record.uid, 'id');
					record.avatar = user && user.avatar;
					record.guest = user && user.guest;
					record.name = user && user.name;
				}

				return {
					title: "红包记录",
					records: records,
					count: count,
					pages: pages,
					limit: limit,
					page: page,
					pageAry: pageAry
				};
			})
		})
	});
}

exports.export = function(req, res) {
	return PacketUserRecord.find({}).then(function(items) {
		var uids = [];
		for (let item of items) {
			uids.push(item.uid);
		}

		return User.find({
			_id: {
				$in: uids
			}
		}).then(function(users_data) {
			var lines = [["姓名", "红包金额"].join(",")];

			for (let item of items) {
				var user = util.find(users_data, item.uid, 'id');
				item.guest = user && user.guest;
				item.name = user && user.name;

				lines.push([item.name, item.amount].join(","));
			}

			res.setHeader('Content-Description', 'File Transfer');
			res.setHeader('Content-Type', 'application/csv; charset=utf-8');
			res.setHeader('Content-Disposition', 'attachment; filename=packet.csv');
			res.setHeader('Expires', '0');
			res.setHeader('Cache-Control', 'must-revalidate');

			// 为了让 Windows 能识别 utf-8，加上了 dom
			res.send('\uFEFF' + lines.join("\r\n"));
		});
	});
}

// 抢红包结果
exports.result = function(req, res) {
	// 列表分页
	var page = Number(req.data.page || 1);
	var limit = 20;
	var pages = 0;
	var pageAry = [];

	// 计算结果总数，做分页处理
	return PacketUserRecord.count().then(function(count) {
		// 总页数
		pages = Math.ceil(count / limit);
		// page不超过pages且大于1
		page = Math.min(page, pages);
		page = Math.max(page, 1);

		for (let i = 0; i < pages; i++) {
			pageAry.push(i);
		}

		var skip = (page - 1) * limit;

		// 返回聚合计算后，分页的结果
		return PacketUserRecord.find().sort({"amount": -1}).limit(limit).skip(skip).then(function(items) {
			var uids = [];
			for (let item of items) {
				uids.push(item.uid);
			}

			return User.find({
				_id: {
					$in: uids
				}
			}).then(function(users_data) {
				// 重新设置聚合后的 item 里的信息
				for (let item of items) {
					var user = util.find(users_data, item.uid, 'id');
					item.avatar = user && user.avatar;
					item.guest = user && user.guest;
					item.name = user && user.name;
				}

				return {
					title: "红包结果",
					items: items,
					count: count,
					pages: pages,
					limit: limit,
					page: page,
					pageAry: pageAry
				};
			});
		});
	});
};

// 获取红包数额配置信息
exports.setup = function(req, res) {
	return PacketSetup.findOne().then(function(record) {
		var ret = record && record.toJSON() || default_setup || {};
		ret.title = "红包配置";
		return ret;
	});
};
// 保存红包数额配置
exports.setup_save = function(req, res, is_socket) {
	var data = req.data;
	var start_time = Date.now();
	start_time += data.countdown * 1e3 || 0;

	return PacketSetup.findOneAndUpdate(
		{},{
			$set: {
				top1 : data.top1,
				top2 : data.top2,
				top3 : data.top3,
				basic : data.basic,
				total : data.total,
				ratio : data.ratio,
				hold_time : data.hold_time,
				amount : data.amount,
				countdown : data.countdown,
				start_time : start_time,
				duration : data.duration
			}
		},
		{upsert: true, new: true}
	).then(function(setup) {

		// 通知红包控制中心准备好配置数据，进入倒计时
		return packet_manager.check().then(function() {
			return setup.toJSON();
		});
	});
}
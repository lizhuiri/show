'use strict';

// 抽奖
var model = require('../../model');
var User = model.User;
var PrizeRecord = model.PrizeRecord;

exports.index = function() {
	// 仅员工且签到可参与抽奖
	return Promise.all([
		User.find({
			guest: false,
			signed: true
		}), 
		PrizeRecord.find({is_deleted: false})
	]).then(function(values) {
		var items = values[0];
		var records = values[1];

		var users = [];
		for (let item of items) {
			users.push({
				_id: item._id,
				name: item.name,
				avatar: item.avatar
			});
		}

		var winner_ids = [];
		for (let record of records) {
			let round = record.round % 100;
			if (!winner_ids[round]) {
				winner_ids[round] = [];
			}
			winner_ids[round] = winner_ids[round].concat(record.uids);
		}

		return {
			title: "舜飞2018年度晚宴-抽奖大屏",
			users: users,
			winner_ids: winner_ids
		};
	});
}

exports.done = function(req, res) {
	res.broadcast('_server_push_/screen_prize_done', {done: true});
	res.end('ok');
}

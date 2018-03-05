'use strict';
const User = require('../../model').User;

function handele(subNum, users) {
	var usersLen = users.length;
	if(usersLen === subNum) {
		return users;
	}
	var arr = [];
	for(var i=0; i < subNum; i++) {
		if(i <= usersLen - 1) {
			arr[i] = users[i];
		}else {
			arr[i] = {
				_id: 'guest',
				avatar: false
			};
		}
	}
	return arr;
}

exports.index = function() {
	var subNum = 200; //页面显示总格子数
	return Promise.all([User.find({
		$or: [
			// 员工
			{guest: false},
			// 已验证嘉宾
			{guest: true, verified: true}
		]
	}), User.count({
		// 已签到
		signed: true,
		$or: [
			// 员工
			{guest: false},
			// 已验证嘉宾
			{guest: true, verified: true}
		]
	})]).then(function(value) {
		var user_list = handele(subNum, value[0]);
		var signNum = value[1]
		return {
			title: '舜飞2018年度晚宴-签到墙',
			userData: user_list,
			subNum: subNum,
			signNum: signNum
		};
	}) 
};
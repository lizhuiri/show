/**
 * ============================
 * 红包
 */
var auth = require('../../lib/auth');
var qr = require('../../lib/qr');
var packet_manager = require('../../lib/packet_manager');
// 二维码
exports.qr = function(req, res) {
	var url = auth.wx_redirect_back('/wx/packet');
	qr.get(url, res);
}

// 渲染
exports.index = function(req, res) {
	return auth.get_user(req, res).then(function(user_info) {
		var user = user_info.user;
		// 没获取到用户，跳转到签到页面
		if (!user) {
			return '未获取到用户信息，无法参与活动！';
		}

		if (!user.signed) {
			return '签到后才能参与活动！';
		}

		if (user.guest && !user.verified) {
			return '嘉宾信息审核中，请稍等~';
		}
		return {
			title: '舜飞2018年度晚宴-摇红包活动'
		};
	});
}

// 抢红包页面检查活动是否开始
exports.status = function(req, res) {
	return {
		status: packet_manager.status(),
		hold_time: packet_manager.hold_time
	}
}

// 摇红包
// ajax/wx/packet/take
exports.take = function(req, res) {
	// 先检查权限
	return auth.get_user(req, res).then(function(user_info) {
		if (!user_info.access.packet) {
			return Promise.reject("非法请求, 权限不足！");
		}

		var uid = user_info.id;
		return packet_manager.take(uid);
	});
}
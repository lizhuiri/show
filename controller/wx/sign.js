/**
 * ============================
 * 签到
 */

var config = require('../../config');
var qr = require('../../lib/qr');
var auth = require('../../lib/auth');
var model = require('../../model');
var User = model.User;

// 签到二维码
exports.qr = function(req, res) {
	var url = auth.wx_redirect_back('/wx/sign');
	qr.get(url, res);
}

// 签到入口
exports.index = function(req, res) {
	return auth.get_user(req, res).then(function(user_info) {
		var signed = user_info.user && user_info.user.signed || false;

		// 签到成功跳到成功页面
		if (signed) {
			res.redirect(302, config.host + '/wx/sign/success');
			return Promise.reject(302);
		}

		return {
			title: "舜飞2018年度晚宴-签到"
		};
	});
}

// 签到操作
exports.trigger = function(req, res) {
	return auth.get_user(req, res).then(function(user_info) {
		var origin_user = user_info.user;
		var promise;
		// 已关联自有用户
		if (origin_user) {
			promise = User.findOneAndUpdate({
				openid: user_info.openid
			}, {
				$set: {
					signed: true
				}
			}, {new: true});
		} else {
			// 没关联的就算作嘉宾
			var wx_user = user_info.wx_user;
			var user = new User({
				openid: user_info.openid,
				avatar: wx_user.avatar,
				guest: true,
				signed: true,
				sign_time: Date.now()
			});
			promise = user.save();
		}

		return promise.then(function(user) {
			// 原来没签到的才推送消息
			if (!origin_user || !origin_user.signed) {
				if (!user.guest) {
					// 员工签到推送
					res.broadcast('_server_push_/wall_sign_in', user.toJSON());
				} else {
					// 通知后台有一个嘉宾加入
					res.broadcast('_server_push_/guest_sign_in', {
						_id: user._id,
						openid: user.openid,
						wx_nickname: wx_user.nickname,
						avatar: wx_user.avatar
					});
				}
			}

			// 嘉宾等待后台审核

			res.redirect(302, config.host + '/wx/sign/success');
			return Promise.reject(302);
		});
	});
}

exports.success = function(req, res) {
	return {
		title: "舜飞2018年度晚宴-签到成功"
	}
}
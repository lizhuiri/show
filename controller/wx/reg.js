/**
 * ============================
 * 员工注册
 */
var path = require('path');
var auth = require('../../lib/auth');
var model = require('../../model');
var config = require('../../config');
var qr = require('../../lib/qr');
var upload = require('../../lib/upload');
var util = require('../../lib/util');
var image_clip = require('../../lib/image_clip');
var User = model.User;

// 注册二维码
exports.qr = function(req, res) {
	var ticket = req.data.ticket;

	var url = auth.wx_redirect_back('/wx/reg?ticket=' + ticket);
	// console.log('注册二维码：', url);
	qr.get(url, res);
}

// 注册页面渲染
exports.index = function(req, res) {
	return {
		title: "舜飞2018年度晚宴-员工注册"
	}
}

// 注册页面提交
exports.submit = function(req, res) {
	return Promise.all([
		auth.get_wx_user(req, res),
		(new Promise(function(resolve, reject) {
			var uploader = upload.single('avatar');
			uploader(req, res, function (err) {
				if (err) {
					reject('上传头像失败，失败原因：' + err);
				} else {
					resolve();
				}
			});
		})).then(function() {
			if (req.file) {
				var file = req.file.path;
				var x = req.body.x || 0;
				var y = req.body.y || 0;
				var w = req.body.w || 500;
				var h = req.body.h || 500;
				var ow = req.body.ow;
				var oh = req.body.oh;

				var avatar_save_path = path.join(config.path.avatar, '' + Date.now() + util.token(5)) + '.jpg';
				return image_clip(500, 500, x, y, w, h, ow, oh, file, path.join(config.path.upload, avatar_save_path)).then(function() {
					if (avatar_save_path.indexOf('/') !== 0) {
						avatar_save_path = '/' + avatar_save_path;
					}
					return avatar_save_path;
				}).catch(function() {
					return '';
				});
			}
		})
	]).then(function(values) {
		var wx_user = values[0];
		var avatar = values[1];
		var ticket = req.body.ticket;
		
		if (!wx_user || !wx_user.openid) {
			return Promise.reject("获取微信授权失败！");
		}

		if (!ticket) {

			return User.findOne({
				openid: wx_user.openid
			}).then(function(user) {
				if (!user) {
					return Promise.reject("非法ticket！");
				}

				return {
					'title': '舜飞2018年度晚宴-注册成功',
					'name': user.name, 
					'avatar': user.avatar
				};

			});
		}

		return User.findOne({
			ticket: ticket
		}).then(function(user) {
			if (!user) {
				return Promise.reject("非法ticket！");
			}

			// 不限制了，允许换微信
			// if (user.openid && user.openid !== wx_user.openid) {
			// 	return Promise.reject("已关联过, 无法重复关联！");
			// }

			user.avatar = avatar || user.avatar || wx_user.avatar;
			user.openid = wx_user.openid;

			return user.save().then(function(user) {
				return {
					'title': '注册成功',
					'name': user.name, 
					'avatar': user.avatar
				};
			})
		});
	});
}
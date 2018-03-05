/**
 * ============================
 * 授权
 */

var request = require('request');
var config = require('../config');
var model = require('../model');
var WxUser = model.WxUser;
var User = model.User;

var appid = config.wx.appid;
var appsecret = config.wx.appsecret;

// 获取微信回跳地址
exports.wx_redirect_back = function(uri) {
	if (uri.indexOf('http') !== 0) {
		if (uri.indexOf('/') !== 0) {
			uri = '/' + uri;
		}
		uri = config.host + uri;
	}
	return 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + appid + '&redirect_uri=' + encodeURIComponent(uri) + '&response_type=code&scope=snsapi_userinfo#wechat_redirect';
}

// 微信授权获取
exports.wx_auth2 = function(req, res) {
	var data = req.data;
	if (!data.code) {
		if (req.websocket) {
			return Promise.reject("无法获取到微信授权！");
		}
		res.redirect(302, exports.wx_redirect_back(req.url));
		return Promise.reject(302);
	}
	return new Promise(function(resolve, reject) {
		request('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + appid + '&secret=' + appsecret + '&code=' + data.code + '&grant_type=authorization_code', function(error, response, body) {
			var param  = JSON.parse(body);
			if (param.errcode) {
				return reject("获取微信授权失败(1), code: " + param.errcode + ', message: ' + param.errmsg);
			}

			var url = 'https://api.weixin.qq.com/sns/userinfo?access_token='+ param.access_token +'&openid=' + param.openid + '&lang=zh_CN';
			request(url, function(error, response , body) {
				var data = JSON.parse(body);
				if (data.errcode) {
					return reject("获取微信授权失败(2), code: " + param.errcode + ', message: ' + param.errmsg);
				}

				resolve(data);
	        });
		});
	})
}

// 把微信用户信息存到mongo
exports.set_wx_user_to_cache = function(res, wx_info) {
	var openid = wx_info && wx_info.openid;
	if (openid) {
		res.session.setid(openid);
		// 先到数据库查
		return WxUser.findOne({
			openid: openid
		}).then(function(wx_user) {
			// 数据库中没有，那就是没关联，跳到关联页面
			if (!wx_user) {
				wx_user = new WxUser({
					openid: openid
				});
			}
			wx_user.sex = +wx_info.sex;
			wx_user.nickname = wx_info.nickname;
			wx_user.avatar = wx_info.headimgurl;
			
			return wx_user.save();
		})
	}

	return Promise.reject('没获取到授权信息！');
}

// 从mongo中获取微信用户信息
exports.get_wx_user_from_cache = function(req) {
	var openid = req.session.getid();
	if (openid) {
		return WxUser.findOne({
			openid: openid
		});
	} 
	return Promise.resolve();
}

// 获取微信用户信息
exports.get_wx_user = function(req, res) {
	// 先从mongo中取
	// 取不到，那就去获取微信授权
	return exports.get_wx_user_from_cache(req).then(function(wx_user) {
		if (wx_user) {
			return wx_user;
		}
		return exports.wx_auth2(req, res).then(exports.set_wx_user_to_cache.bind(exports, res));
	});
}

// 获取用户信息
// 包含自由用户信息和微信用户信息
exports.get_user = function(req, res) {
	return exports.get_wx_user(req, res).then(function(wx_user) {
		return User.findOne({
			openid: wx_user.openid
		}).then(function(user) {
			return {
				// 自有id
				id: user && user.id,
				// openid
				openid: wx_user.openid,
				// 自有用户信息
				user: user && user.toJSON(),
				// 微信用户信息
				wx_user: wx_user,
				// 权限
				access: {
					// 红包
					packet: user && (!user.guest || user.guest && user.verified),
					// 抽奖
					prize: user && !user.guest,
					// 抽奖控制
					prize_ctrl: user && (!user.guest || user.guest && user.verified)
				}
			};
		});
	});
}



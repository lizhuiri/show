var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 微信用户
var WxUserSchema = new Schema({
	// 性别，值为1时是男性，值为2时是女性，值为0时是未知
	sex: {type: Number, default: 0},
	// openid
	openid: String,
	// 微信头像
	avatar: String,
	// 微信昵称
	nickname: String
});

WxUserSchema.set('toJSON', { getters: true, virtuals: true });
WxUserSchema.set('toObject', { getters: true, virtuals: true });

var WxUser = mongoose.model("WxUser", WxUserSchema);

module.exports = WxUser;

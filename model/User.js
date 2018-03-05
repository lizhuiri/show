var mongoose = require('mongoose');
var util = require('../lib/util');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	// 注册ticket
	ticket: String,
	// 名称
	name: String,
	// 邮箱
	email: String,
	// 头像
	avatar: String,
	// 签到时间
	sign_time: Date,
	// 已签到
	signed: {type: Boolean, default: false},
	// 是否嘉宾
	guest: {type: Boolean, default: false},
	// 嘉宾需要确认通过
	verified: {type: Boolean, default: false},
	// wx openid
	openid: String
});

// 生成注册ticket
UserSchema.pre('save', function(next) {
	if (!this.ticket) {
		this.ticket = util.token(20);
	}
	next();
}); 

UserSchema.set('toJSON', { getters: true, virtuals: true });
UserSchema.set('toObject', { getters: true, virtuals: true });

var User = mongoose.model("User", UserSchema);

module.exports = User;

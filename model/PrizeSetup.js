var mongoose = require('mongoose');
var util = require('../lib/util');
var Schema = mongoose.Schema;

var PrizeSetupSchema = new Schema({
	name: String,
	// 抽奖类型，1为单个，2为批量
	type: {type: Number, enum: [1, 2]},
	// 奖品数量
	count: Number,
	// 一次抽多少个，批量最多抽60个，单个此值恒为1
	limit: Number,
	// 当前第几轮
	round: Number,
	// 当前轮次ticket
	ticket: String
});

// 生成注册ticket
PrizeSetupSchema.pre('save', function(next) {
	this.ticket = util.token(20);
	next();
});

PrizeSetupSchema.set('toJSON', { getters: true, virtuals: true });
PrizeSetupSchema.set('toObject', { getters: true, virtuals: true });

var PrizeSetup = mongoose.model("PrizeSetup", PrizeSetupSchema);

module.exports = PrizeSetup;

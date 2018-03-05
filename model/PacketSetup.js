var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PacketSetupSchema = new Schema({
	// 前三名大奖
	top1: Number,
	top2: Number,
	top3: Number,
	// 最低红包金额
	basic: Number,
	// 随机红包总个数
	total: Number,
	// 金额
	amount: Number,
	// 红包放大比例（掺假红包）
	ratio: Number,
	// 每个红包的处理时间
	hold_time: Number,
	// 倒计时时长
	countdown: Number,
	// 抢红包实际开始时间
	start_time: Number,
	// 抢红包活动持续时间
	duration: Number
});

PacketSetupSchema.set('toJSON', { getters: true, virtuals: true });
PacketSetupSchema.set('toObject', { getters: true, virtuals: true });

var PacketSetup = mongoose.model("PacketSetup", PacketSetupSchema);

module.exports = PacketSetup;

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 个人红包记录
var PacketUserRecordSchema = new Schema({
	// uid
	uid: String,
	// 金额
	amount: Number,
	// 最后一次抢红包时间
	time: Date
});

PacketUserRecordSchema.set('toJSON', { getters: true, virtuals: true });
PacketUserRecordSchema.set('toObject', { getters: true, virtuals: true });

var PacketUserRecord = mongoose.model("PacketUserRecord", PacketUserRecordSchema);

module.exports = PacketUserRecord;

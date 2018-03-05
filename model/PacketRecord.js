var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 红包记录
var PacketRecordSchema = new Schema({
	// uid
	uid: String,
	// 金额
	amount: Number,
	// 是否包含最低保障红包
	basic: {type : Boolean, default :false},
	// 时间
	time: Date
});

PacketRecordSchema.set('toJSON', { getters: true, virtuals: true });
PacketRecordSchema.set('toObject', { getters: true, virtuals: true });

var PacketRecord = mongoose.model("PacketRecord", PacketRecordSchema);

module.exports = PacketRecord;

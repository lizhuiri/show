var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PrizeRecordSchema = new Schema({
	// uid
	uids: [String],
	name: String,
	// 轮次
	round: Number,
	// 时间
	time: Date,
	// 是否软删除
	is_deleted: {type: Boolean, default: false}
});

PrizeRecordSchema.set('toJSON', { getters: true, virtuals: true });
PrizeRecordSchema.set('toObject', { getters: true, virtuals: true });

var PrizeRecord = mongoose.model("PrizeRecord", PrizeRecordSchema);

module.exports = PrizeRecord;
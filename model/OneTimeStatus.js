var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OneTimeStatusSchema = new Schema({
	skey: String,
	svalue: {type : Boolean, default :false}
});

OneTimeStatusSchema.set('toJSON', { getters: true, virtuals: true });
OneTimeStatusSchema.set('toObject', { getters: true, virtuals: true });

var OneTimeStatus = mongoose.model("OneTimeStatus", OneTimeStatusSchema);

module.exports = OneTimeStatus;

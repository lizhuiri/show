var mongoose = require('mongoose');
var config = require('../config');
var settings = config.mongo;

mongoose.connect('mongodb://' + settings.HOST + ':' + settings.PORT + '/' + settings.DB, { useMongoClient: true });

mongoose.Promise = global.Promise;
var db = mongoose.connection;

db.once('open', () => {
    console.log('连接数据成功');
});

db.on('error', function (error) {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});

db.on('close', function () {
    console.log('数据库断开，重新连接数据库');
    // mongoose.connect(config.url, {server:{auto_reconnect:true}});
});


exports.getMongoRegx = function(name, space, flag) {
	if(space === undefined) {
		space = ' ';
	}
	if(flag === undefined) {
		flag = 'i';
	}

	name = name.replace(/([$^|*+\-.{}\\\[\]\(\)])/g, '\\$1');
	var ns = name.trim().split(new RegExp('['+ space +']+', 'g'));
	return new RegExp('(' + ns.join('|') + ')', flag);
}

exports.PrizeSetup = require('./PrizeSetup');
exports.PrizeRecord = require('./PrizeRecord');
exports.PacketRecord = require('./PacketRecord');
exports.PacketUserRecord = require('./PacketUserRecord');
exports.PacketSetup = require('./PacketSetup');
exports.User = require('./User');
exports.WxUser = require('./WxUser');
exports.OneTimeStatus = require('./OneTimeStatus');

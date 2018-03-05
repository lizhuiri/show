var multer = require('multer');
var config = require('../config');
var util = require('./util');
var path = require('path');
var storage = multer.diskStorage({
	destination: config.path.upload_tmp,
	//给上传文件重命名，获取添加后缀名
	filename: function(req, file, cb) {
		var fileFormat = (file.originalname).split(".");
		var hash = '' + Date.now() + util.token(5);
		cb(null, file.fieldname + '-' + hash + "." + fileFormat[fileFormat.length - 1]);
	}
});
//添加配置文件到muler对象。
var upload = multer({
	storage: storage
});
module.exports = upload;
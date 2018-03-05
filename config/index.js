if (process.env.CONFIG_FILE) {
	module.exports = require(process.env.CONFIG_FILE);
	return;
}

var path = require('path');
var fs = require('fs');
var root = path.dirname(__dirname);

var is_development = process.platform == 'win32' || process.platform == 'darwin';

if (is_development && fs.existsSync(path.join(__dirname, 'dev.js'))) {
	module.exports = require('./dev.js');
} else {
	module.exports = {
		host: 'http://192.168.10.250:8029',
		// node监听端口
		port: 8029,
		// mongo配置
		mongo: {
			HOST: '192.168.10.250',
			PORT: 27017,
			DB: 'aao_test'
		},
		// 微信号公众号账号配置
		wx: {
			appid: 'wxdcf11351e4ea785f',
			appsecret: '5ee8bbe964b7f0e367c7ed6c17ba027e'
		},
		path: {
			// 上传临时目录
			upload_tmp: path.join(root, '/data/tmp'),
			// 上传目录
			upload: path.join(root, '/data/upload'),
			// 基于upload目录
			avatar: 'avatar',
		},
		bin: {
			// 图片剪裁php脚本路径
			image_clip_script: path.join(root, '/bin/clip.php')
		},
		root: root,
		controller_base: path.join(root, 'controller'),
		admin_uri: 'd90df83fb64fb',
		email: {
			host: 'smtp.exmail.qq.com',
			port: 465,
			secure: true,
			auth: {
				user: 'adm@sunteng.com',
				pass: 'Yu123456'
			}
		}
	}
}


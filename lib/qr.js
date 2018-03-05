/**
 * ============================
 * 二维码
 */
var qr = require('qr-image');

exports.get = function(url, res) {
	var qrcode = qr.image(url, {size: 10});
	res.type('png');
	qrcode.pipe(res);
}
var child_process = require('child_process');
var fs = require('fs');
var config = require('../config');
var script_path = config.bin.image_clip_script;

module.exports = function(save_width, save_height, clip_left, clip_top, clip_width, clip_height, origin_width, origin_height, input_file, output_path) {
	var args = [].slice.call(arguments);
	args.unshift(script_path);
	args.unshift('php');
	return (new Promise(function(resolve, reject) {
		child_process.exec(args.join(' '), function(err, stdout, stderr) {
			if (err){
				reject(err);
			}

			if (stdout && stdout.toString().indexOf("error:") === 0) {
				reject(stdout);
			} else {
				resolve(stdout);
			}
		}, {
			timeout: 120 * 1e3
		});
	})).then(function(data) {
		// 删除临时文件
		return new Promise(function(resolve) {
			fs.unlink(input_file, function(err) {
				resolve(data);
			});
		}); 
	});
}

/**
 * ============================
 * 大屏控制
 */
var config = require('../../config');

exports.ctrl = function(req, res) {
	return {
	}
}

exports.switch = function(req, res) {
    switch(req.data.page) {
        case 'wall':
            res.broadcast('_server_push_/screen_redirect', {page: config.host + '/wall'});
        break;
        case 'packet':
            res.broadcast('_server_push_/screen_redirect', {page: config.host + '/packet'});
        break;
        case 'prize':
            res.broadcast('_server_push_/screen_redirect', {page: config.host + '/prize'});
        break;
    }

    return true;
}
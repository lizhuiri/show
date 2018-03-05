// render
exports.index = function(req, res) {
	return {
		xxx: 456
	};
}

// websocket test
exports.websocket = function(req, res, is_socket) {
	console.log('server received: ', req.data);
	
	res.broadcast('admin/demo/broadcast', {
		f: 4
	});

	return {
		b: 132
	}
}

// cookie test
// cookie set
exports.cookie_write = function(req, res) {
	var cookie = 98756;
	res.session.setid(cookie);
	res.message('write cookie: ' + cookie);
}
// cookie get
exports.cookie_get = function(req, res) {
	res.message('get cookie: ' + req.session.getid());
}


var _util = {
	creatArray(arrLength) {
		var arr = [];
		for (var i = 0; i < arrLength; i++) {

			arr[i] = i;
		}
		return arr;
	},
	getRandom(num) {
		return Math.floor(Math.random() * num);
	}
}
var arr  = _util.creatArray(200);
function getRan() {
	var ran = _util.getRandom(arr.length);
	var No = arr.splice(ran, 1);
	return No[0]
}
// ============================== 业务测试 ==============================
// 定时推送签到
exports.signin = function(req, res) {
	var duration = +req.data.duration || 3;

	setInterval(function() {
		var uid = getRan();
		res.broadcast('_server_push_/wall_sign_in', {
			_id: uid,
			name: '张三',
			avatar: 'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=2521370602,2003900614&fm=27&gp=0.jpg'
		});
	}, duration * 1e3);
	res.message('将每' + duration + '秒推送一次虚拟签到信息！');
}


// 推送抽奖渲染
exports.prize = function(req, res) {
	return {};
}

// 单个开始
exports.prize_s_start = function(req, res) {
	res.broadcast('_server_push_/prize_s_start');
	return true;
}

// 单个结束
exports.prize_s_stop = function(req, res) {
	res.broadcast('_server_push_/prize_s_stop', {uid: req.data.uid});
	return true;
}

// 批量抽
exports.prize_m_take = function(req, res) {
	res.broadcast('_server_push_/prize_m_take', {uids: req.data.uids});
	return true;
}


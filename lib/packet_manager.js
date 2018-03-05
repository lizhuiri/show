/**
 * ============================
 * 红包控制中心
 */

var EventEmitter = require('events').EventEmitter;
var model = require('../model/index');
var config = require('../config');
var socket = require('./socket');
var PacketSetup = model.PacketSetup;
var PacketRecord = model.PacketRecord;
var PacketUserRecord = model.PacketUserRecord;
var User = model.User;

function randon_between(min, max) {
	// 保留两位小数
	return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function PacketManager() {
	this._running = false;
	this._ready = false;
	this._end = false;
	EventEmitter.call(this);
	this.on('ready', function() {
		// 监听ready消息，通知切换到红包大屏
		socket.broadcast('_server_push_/screen_redirect', {page: config.host + '/packet'});
	});
	var _this = this;
	this.on('run', function() {
		// 监听ready消息, 通知抢红包微信页面可以开始了
		socket.broadcast('_server_push_/wx_packet_start',{hold_time: _this.hold_time});
	});
	this.on('end', function() {
		// 监听ready消息, 通知抢红包微信页面活动结束
		socket.broadcast('_server_push_/wx_packet_end');
	});
	// 不自动启动
	// this.check();
}
// 检查是否应该开始了
PacketManager.prototype.check = function() {
	var _this = this;
	return PacketSetup.findOne().then(function(config) {
		if (config) {
			return _this.prepare(config);
		}
		return false;
	});
}
PacketManager.prototype.status = function() {
	// 已结束
	if (this._end) {
		return 3;
	}
	// 已开始
	if (this._running) {
		return 2;
	}
	// 倒计时过程，即将开始
	if (this._ready) {
		return 1;
	}

	// 红包还未配置
	return 0;
}
PacketManager.prototype.get = function(key) {
	switch(key) {
		// 剩余时间
		case 'start_time':
			return this.start_time;

		// 剩余个数
		case 'remain_count':
			return this.total - this.count;

		// 剩余金额(不计算前三额外奖励和最低金额)
		case 'remain_amount':
			return this.remain_amount;

	}
}
// 活动预备
PacketManager.prototype.prepare = function(config) {
	// 如果已经开始了那就只能等待结束啊
	if (this._running) {
		return Promise.resolve();
	}

	// 清除定时开始任务
	if (this.timer) {
		clearTimeout(this.timer);
	}

	this.count = 0;
	this.serial = 0;
	this._ = [];

	var _this = this;
	return User.count({
		// 已签到
		signed: true,
		$or: [
			// 员工
			{guest: false},
			// 已验证嘉宾
			{guest: true, verified: true}
		]
	}).then(function(user_count) {
		// 最低红包金额
		_this.min = 0.01;

		_this.id  = config._id;
		_this.basic = config.basic;
		_this.total = config.total;
		_this.start_time = config.start_time;
		_this.duration = config.duration;
		_this.amount = config.amount;
		_this.top1 = config.top1;
		_this.top2 = config.top2;
		_this.top3 = config.top3;
		_this.ratio = config.ratio;
		_this.hold_time = config.hold_time;
		_this.user_count = user_count;

		_this.remain_amount = _this.amount - _this.top1 - _this.top2 - _this.top3 - _this.basic * _this.user_count;

		var delay = Math.max(0, config.start_time - Date.now());
		_this._ready = true;
		_this._end = false;
		_this.emit('ready', true);
		_this.timer = setTimeout(_this.run.bind(_this), delay);

		return true;
	});
}
PacketManager.prototype.run = function() {
	this._running = true;
	this._ready = false;
	this.emit('run', true);
	// 活动结束时间
	this.timer2 = setTimeout(this.end.bind(this), this.duration * 6e4);
	return this;
}
// 活动结束
PacketManager.prototype.end = function() {
	if (!this._end) {
		this._end = true;
		this._ready = false;
		this._running = false;
		// 前3结算
		var _this = this;
		PacketUserRecord.find().sort({"amount": -1}).limit(3).then(function(items) {
			var item0 = items[0];
			var item1 = items[1];
			var item2 = items[2];
			var promises = [];
			if (item0) {
				item0.amount += _this.top1;
				item0.amount = Math.round(item0.amount * 100) / 100;
				promises.push(item0.save());
			}
			if (item1) {
				item1.amount += _this.top2;
				item1.amount = Math.round(item1.amount * 100) / 100;
				promises.push(item1.save());
			}
			if (item2) {
				item2.amount += _this.top3;
				item2.amount = Math.round(item2.amount * 100) / 100;
				promises.push(item2.save());
			}

			return Promise.all(promises).then(function() {
				// 发送通知
				_this.emit('end', true);
			});
		});
	}
}
// 取红包, 可以同时取红包了
PacketManager.prototype.take = function(uid) {
	var _this = this;

	if (!_this._running) {
		// 活动未开始
		return {
			status: _this.status()
		};
	}

	return PacketUserRecord.findOne({uid: uid}).then(function(userRecord) {
		var min = _this.min;
		// 剩余金额
		var remain_amount = _this.remain_amount;
		// 剩余红包个数
		var remain_count = _this.total - _this.count;
		// 小于1分钱就结束活动
		if (_this._end || remain_count <= 0 || remain_amount <= min) {
			// 活动已结束
			return {
				status: 3
			};
		}

		// 当前为保障红包
		var current_basic = false;

		// 没有个人红包记录，则为保障红包
		if (!userRecord) {
			// 保障红包不能为空红包
			userRecord = new PacketUserRecord({
				uid: uid,
				amount: 0
			});
			current_basic = true;
		} else {
			// 非保障红包是根据放大比例给空红包的
			// 空红包
			if ((++_this.serial) % _this.ratio !== 0) {
				return {
					status: _this.status(),
					// 假的
					fake: true
				}
			}
		}

		// ====== 随机红包 ======
		// 当前分配金额
		var current_amount;
		// 最后一个人分配剩余所有
		if (remain_count === 1) {
			current_amount = remain_amount;
			_this.remain_amount = 0;
		} else {
			// 剩余平均数
			var remain_avg = remain_amount / remain_count;
			current_amount = randon_between(min, remain_avg * 2);
			// 如果剩余金额不够每个人分最低值，那就均分
			if ((remain_amount - current_amount) / (remain_count - 1) < min) {
				current_amount = remain_avg;
				// 保留两位小数
				current_amount = Math.round(current_amount * 100) / 100;
			}
			_this.remain_amount -= current_amount;
		}

		// 红包数+1
		_this.count++;

		// 加上保障红包
		if (current_basic) {
			current_amount += _this.basic;
		}
		// 保留两位小数
		current_amount = Math.round(current_amount * 100) / 100;

		var time = Date.now();
		var record = new PacketRecord({
			uid: uid,
			amount: current_amount,
			basic: current_basic,
			time: time
		});

		userRecord.amount += current_amount;
		// 保留两位小数
		userRecord.amount = Math.round(userRecord.amount * 100) / 100;
		userRecord.time = time;

		return Promise.all([record.save(), userRecord.save(), PacketUserRecord.find(null, null, {sort: {amount: 1}})]).then(function(values) {
			var allUserRecords = values[2];

			// 打败多少人
			var defeat_per = 100;
			if (allUserRecords.length > 1) {
				for (var i = 0; i < allUserRecords.length; i++) {
					if (allUserRecords[i].uid === uid) {
						break;
					}
				}

				defeat_per = Math.round(i / (allUserRecords.length - 1) * 100);
			}

			// 要晚于回复消息之前end，不然会错误显示
			setTimeout(function() {
				_this.emit('take', {
					uid: uid,
					amount: values[0].amount
				});

				// 红包被抢完了，停止活动
				if (_this.total - _this.count <= 0 || _this.remain_amount < min) {
					_this.end();
				}
			}, 100);

			return {
				status: _this.status(),
				// 当前金额
				amount: values[0].amount,
				// 总额
				total: values[1].amount,
				// 打败百分比
				defeat_per: defeat_per
			}
		});
	});
}
PacketManager.prototype.__proto__ = EventEmitter.prototype;

module.exports = new PacketManager();

(function() {
	if (!Function.prototype['bind']) {
	    Function.prototype['bind'] = function (object) {
	        var originalFunction = this;
	        if (arguments.length === 1) {
	            return function () {
	                return originalFunction.apply(object, arguments);
	            };
	        } else {
	            var partialArgs = Array.prototype.slice.call(arguments, 1);
	            return function () {
	                var args = partialArgs.slice(0);
	                args.push.apply(args, arguments);
	                return originalFunction.apply(object, args);
	            };
	        }
	    };
	}

	function hasClass(elm, klazz) {
	    return elm.className.match(new RegExp('(\\s|^)' + klazz + '(\\s|$)'));
	}

	function addClass(elm, klazz) {
	    if (!hasClass(elm, klazz)) {
			elm.className = (elm.className || "").trim() + " " + klazz;
		}
	}

	function removeClass(elm, klazz) {
		var cls = ' ' + elm.className + ' ';
		elm.className = cls.replace(' '+klazz+' ', ' ').trim();
	}

	function addEvent(elm, type, handle, capture) {
		if (elm.addEventListener) {
			elm.addEventListener(type, handle, !!capture);
		} else if (elm.attachEvent) {
			elm.attachEvent("on" + type, handle);
		}
	}

	function $(selector) {
		return document.querySelector(selector);
	}

	function $$(selector) {
		return document.querySelectorAll(selector);
	}

	function $id(id) {
		return document.getElementById(id);
	}

	function randomsort(a, b) {
        return Math.random()>.5 ? -1 : 1;
	}

	function randomsortByGrid(a, b) {
		if (a.element.style.opacity == 0.25) return 1;
		if (b.element.style.opacity == 0.25) return -1;
		if ( ylTable.indexOf(+a.element.id.slice(3)) > -1 ) return 1;
		if ( ylTable.indexOf(+b.element.id.slice(3)) > -1 ) return -1;
		return Math.random()>.5 ? -1 : 1;
	}

	function Chouj(data, options) {
		// 切换频率，即每秒钟跳动次数
		this.frequency = options.frequency || 50;
		// 延时时间，即停止后延时跳动时长（单位: s）
		this.delay = options.delay || 3;
		// 是否在抽奖中
		// 抽奖状态 1: 未开始，2：开始，3：已停止在延时执行
		this.status = 1;
		// 员工数据
		this.data = data[0].slice(0);
		// 中奖人员 人员 -> 第几轮中奖
		this.winners = [];
		this.winner_ids = [];
		this.history = [];
		// 第x轮
		this.round = 1;
		// 定时器句柄
		this.timer = null;
		this.runtimer = null;
		// 循环次数，循环鉴定
		this.loopNum = 0; //当前循环次数
		this.runNum = 5; // 需要循环的次数
		// 当前跳动人员索引
		this.current = -1;
		// dom缓存
		this.objects = data[1].slice(0);
		this.oid = -1;
		this.doms = null;
		this.num;
		// 行数
		this.lineNum = options.lineNum || 18;

		this.init();
	}
	Chouj.prototype.init = function() {
		// this.bindEvent();

		// load localstorage winner
		this.getHistory();
		this.updateUserStatue();

		$id('begin').style.display = 'inline';
		$id('end').style.display = 'none';
		return this;
	};
	// 绑定事件
	Chouj.prototype.bindEvent = function() {
		addEvent(document.body, 'keyup', this._shortCutKey.bind(this));
		// window.onbeforeunload = function() {
		// 	return "快住手！！别点下去！！";
		// }
		return this;
	};
	Chouj.prototype._shortCutKey = function(evt) {
		evt = evt || window.event;
		var key = evt.keyCode || evt.charCode || evt.which;

		switch (key) {
			case 192:
				if($('.result').style.display == 'none'){
					$('.result').style.display = 'block';
				}else{
					$('.result').style.display = 'none';
				}
			break;
			// enter
			case 13: this.start();
			break;
			// space
			case 32: this.stop();
			break;
			// alt + n
			case 78:// this.nextRound();
				$id('next').click();
			break;
			// alt + r
			case 82: //this.showResu();
				$id('result-open').click();
			break;
			case 84:
				document.querySelector('.result-close').click();
				break;
			// 1
			case 49:
				$id('table').click();
			break;
			// 2
			case 50:
				$id('sphere').click();
			break;
			// 3
			case 51:
				$id('helix').click();
			break;
			// 4
			case 52:
				$id('grid').click();
				// transform( targets.grid, 500 ,'' ,TWEEN.Easing.Bounce.InOut);
			break;
		}

		if (evt.preventDefault) {
			evt.preventDefault();
		}
	};
	// 展示结果
	Chouj.prototype.showResult = function() {
	};
	// 抽奖多个
	Chouj.prototype.run = function(runNum = 1) {
		var self = this;
		if (self.status != 1) {
			return;
		}

		var stopFn = this.stop.bind(this, true);
		var runFn = function() {
			if (runNum --> 0) {
				self.start(6);
				setTimeout(stopFn, 1000);
				setTimeout(runFn, 7000);
			}
		}

		//第一次执行
		runFn();
	};
	// 开始抽奖
	Chouj.prototype.start = function(frequency) {
		var self = this;
		if (self.status != 1) {
			return console.log('抽奖正在进行，不可再次开始');
		}
		self.status = 2;
		self.musicStart();
		$id('begin').style.display = 'none';
		$id('end').style.display = 'inline';

		self.timer = setInterval(function(){
			//下个位置获取计算
			var allNum = self.data.length;
			var ln = self.lineNum;

			// 查找下一个中奖者位置
			var pos = /*self.num || */Math.floor(Math.random() * allNum);
			var dir = Math.floor(Math.random() * 8);
			switch (dir) {
				case 0: pos -= 1; break;
				case 1: pos -= (ln+1); break;
				case 2: pos -= ln; break;
				case 3: pos -= (ln-1); break;
				case 4: pos += 1; break;
				case 5: pos += (ln-1); break;
				case 6: pos += ln; break;
				case 7: pos += (ln+1); break;
			}
			pos = (pos + allNum) % allNum;

			// 检查用户是否已经是中奖用户
			var count = allNum;
			var id = objects[pos].__id__;
			while (count-->0 && ~self.winner_ids.indexOf(id)) {
				pos = (pos + (dir < 4 ? -1 : 1) + allNum) % allNum;
				id = objects[pos].__id__;
			}
			if (count < 0) {
				console.log('no winner!!');
				return;
			}

			var obj = self.objects[id];
			if (obj) {
				if (self.doms) {
					removeClass(self.doms, 'blbl');
				}
				self.num = pos;
				self.oid = id;
				self.doms = obj.element;
				addClass(self.doms, 'blbl');
			}
		}, frequency ? 1000/frequency : 1000/this.frequency);
	};
	// 停止抽奖，会延时跳动一段时间
	Chouj.prototype.stop = function(immediately, uid) {
		var self = this;
		if (self.status != 2){
			return console.log('抽奖未开始');
		}
		self.status = immediately ? 1 : 3;

		setTimeout(doStop.bind(self, uid), self.delay * 1000);
	};

	function doStop(uid) {
		var self = this;
		clearInterval(self.timer);

		// 展示服务器抽奖结果
		if (uid) {
			var u = self.findUser(uid);
			console.log(u);
			if (u) {
				var obj = self.objects[u.index];
				if (obj) {
					if (self.doms) {
						removeClass(self.doms, 'blbl');
					}
					self.oid = u.index;
					self.doms = obj.element;
					addClass(self.doms, 'blbl');
				}
			}
		}

		var id = self.oid;
		var object = self.objects[id];

		var moveTo = new TWEEN.Tween( object.position )
			.to( { x: 0, y: 0, z: camera.position.z-400 }, 1000 )
			.easing( TWEEN.Easing.Quadratic.Out )
			.onUpdate( render )

		var moveTo2 = new TWEEN.Tween( object.rotation )
			.to( { x: 0, y: 0, z: 0 }, 1000 )
			.easing( TWEEN.Easing.Exponential.InOut )

		var moveBack = new TWEEN.Tween( object.position )
			.to( { x: object.position.x, y: object.position.y, z: object.position.z }, 1000 )
			.delay(3000)
			.easing( TWEEN.Easing.Quadratic.Out )
			.onUpdate( render )

		var moveBack2 = new TWEEN.Tween( object.rotation )
			.to( { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z }, 1000 )
			.delay(3000)
			.easing( TWEEN.Easing.Exponential.InOut )
			.onComplete(function(){
				if (self.status == 3) {
					self.status = 1;
				}
				if (self.status == 1) {
					self.musicStop();
				}
				$id('begin').style.display = 'inline';
				$id('end').style.display = 'none';
				self.updateUserStatue();
			})

		moveTo.chain(moveBack);
		moveTo2.chain(moveBack2);

		moveTo.start()
		moveTo2.start()

		var elm = self.doms;
		var user = self.data[id];
		self.winners.push({
			round: self.round,
			num: id,
			img: user.avatar,
			name: user.name
		});

		self.winner_ids.push(id);
		self.saveHistory();
	};

	//批量抽奖动画随机位置
	Chouj.prototype.batch = function(delay, uids){
		var self = this;
		// if (self.round >= 3) {
		// 	return false;
		// }

		TWEEN.removeAll();
		for (var i = 0; i < objects.length; i++) {
			new TWEEN.Tween( objects[i].position )
				.to( { x: Math.random() * 4000 - 2000, y: Math.random() * 4000 - 2000, z: Math.random() * 4000 - 2000 }, Math.random() * delay )
				.easing( TWEEN.Easing.Exponential.Out )
				.start()
		}

		new TWEEN.Tween( self )
			.to( {}, delay + 100 )
			.onUpdate( render )
			.start()
			.onComplete(selectBatch.bind(self, uids));
	};

	function selectBatch(uids) {
		var self = this;
		// 选择中奖的人
		var total = self.data.length;
		var ids = [];
		var id, user;

		// 按照服务器结果展示
		if (uids) {
			while (uids.length) {
				user = self.findUser(uids.pop());
				if (user && self.winner_ids.indexOf(user.index) == -1) {
					id = user.index;
					ids.push(id);
					self.winner_ids.push(id);
					self.winners.push({
						round: self.round,
						num: id,
						img: user.avatar,
						name: user.name
					});
				}
			}
		}
		else {
			var count = 30;
			while (count > 0 && total > self.winner_ids.length) {
				id = Math.floor(Math.random() * total);
				if (self.winner_ids.indexOf(id) == -1) {
					count--;
					ids.push(id);
					user = self.data[id];

					self.winner_ids.push(id);
					self.winners.push({
						round: self.round,
						num: id,
						img: user.avatar,
						name: user.name
					});
				}
			}
		}

		self.saveHistory();

		// 排列选中的人员到界面前面
		var objs = [];
		for (id=0; id<total; id++) {
			if (~ids.indexOf(id)) {
				objs.unshift(self.objects[id]);
			}
			else {
				objs.push(self.objects[id]);
			}
		}
		objects = objs;
		var dom, id;
		for (var id of ids) {
			dom = self.objects[id].element;
			addClass(dom, 'blbl');
		}

		transform( (ids.length > 10 ? targets.grid : targets.grid10), 1000, function(){
			setTimeout(function(){
				self.randomSort();
				transform( targets[showType], 2000, function(){
					$id('menu').style.display = 'block';
					for (id of ids) {
						dom = self.objects[id].element;
						removeClass(dom, 'blbl');
					}
					self.updateUserStatue();
				});
			}, 3500);
		});
	};

	// 下一轮
	Chouj.prototype.nextRound = function( round ) {
		if (!round) {
			// if (this.winners.length == 0) {
			// 	alert('当前获奖数据为空')
			// 	return false;
			// }

			round = this.round+1;
		}
		if (round<1){
			round = 1;
		}
		this.round = round;
		this.winners = this.history[round] || [];
		this.updateUserStatue();
	};

	// 随机排序
	Chouj.prototype.randomSort = function(){
		objects.sort(randomsort);
	};

	Chouj.prototype.updateUserStatue = function() {
		var id, cls, elm;
		var cur_wins = [];
		for (var win of this.winners) {
			cur_wins.push(win.num);
		}
		for (var obj of this.objects) {
			id = obj.__id__;
			elm = obj.element;
			if (~cur_wins.indexOf(id)) {
				cls = 'act wins';
			}
			else if (~this.winner_ids.indexOf(id)) {
				cls = 'wins';
			}
			else {
				cls = '';
			}

			removeClass(elm, 'act');
			removeClass(elm, 'wins');
			removeClass(elm, 'blbl');
			if (cls) {
				addClass(elm, cls);
			}
		}

		if (this.ani_callback) {
			var cb = this.ani_callback;
			this.ani_callback = null;
			cb();
		}
	}

	Chouj.prototype.getResult = function() {
		var html = '';
		for (var i=1; i < this.history.length; i++) {
			html += '<div><h1 class="result-div" style="color:red;">第'+i+'轮抽奖：</h1>';
			var wins = this.history[i];
			if (wins) {
				for (var win of wins) {
					if (win) {
						html += '<span class="result-span">'+win.name+'</span>';
					}
				}
			}
			html += '<div style="clear: both;"></div></div>';
		}

		return html;
	}

	// 开始播放音乐
	Chouj.prototype.musicStart = function() {
		var dom = $id('music');
		dom.currentTime = 0;
		dom.play();
	};
	// 停止播放音乐
	Chouj.prototype.musicStop = function() {
		$id('music').pause();
	};

	Chouj.prototype.resetHistory = function() {
		// localStorage.removeItem('winners');
		this.round = 1;
		this.winner_ids = [];
		this.history = [];
		this.winners = [];
		this.updateUserStatue();
	}
	Chouj.prototype.saveHistory = function() {
		this.history[this.round] = this.winners;
		// localStorage.setItem(
		// 	'winners',
		// 	JSON.stringify(this.history)
		// );
	}

	Chouj.prototype.findUser = function(uid) {
		var users = this.data;
		for (var id=0; id<users.length; id++) {
			if (users[id]._id == uid) {
				users[id].index = id;
				return users[id];
			}
		}
		return null;
	}

	Chouj.prototype.getHistory = function() {
		try {
			var pw = window._prize_winner_ids_;
			var wins = [];
			var i,j,u;
			for (i=1; i<pw.length; i++) {
				if (pw[i]) {
					wins[i] = [];
					for (j=0; j<pw[i].length; j++) {
						u = this.findUser(pw[i][j]);
						if (u) {
							wins[i][j] = {
								round: i,
								num: u.index,
								img: u.avatar,
								name: u.name
							};
						}
					}
				}
			}

			this.history = wins;

			this.winners = this.history[this.round] || [];
			this.winner_ids = [];
			for (var round of wins) {
				if (round) {
					for (var win of round) {
						this.winner_ids.push(win.num);
					}
				}
			}
		}
		catch(err){}
	};

	window.Chouj = Chouj;
})();

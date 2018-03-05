// 全局socket和
(function() {

	function cookie(n) {
		var d = new Date(),
			a = arguments,
			l = a.length;
		if (l > 1) {
			var e = a[2] || 0,
				p = a[3] || "/",
				dm = a[4] || 0,
				se = a[5] || 0;
			if (e) {
				d.setTime(d.getTime() + (e * 1E3));
			}
			document.cookie = n + "=" + escape(a[1]) + (e ? ("; expires=" + d.toGMTString()) : "") + ("; path=" + p) + (dm && dm != "none" ? ("; domain=" + dm) : "") + (se ? "; secure" : "");
			return a[1];
		} else {
			var v = document.cookie.match("(?:^|;)\\s*" + n + "=([^;]*)");
			return v ? unescape(v[1]) : 0
		}
	}

	var origin = io(location.origin);
	var socket = {
		on: function(uri, callback) {
			this._.push([uri, callback]);
			return this;
		},
		once: function(uri, callback) {
			this._.push([uri, callback, true]);
			return this;
		},
		getCookies: function() {
			var arr = (document.cookie || '').split(/;\s*/);
			var cookies = {};
			while(arr.length) {
				var item = arr.shift();
				var pair = item.split('=');
				if (pair.length > 1) {
					cookies[pair[0]] = decodeURIComponent(pair[1]);
				}
			}

			return cookies;
		},
		setCookies: function(cookies) {
			if (cookies) {
				for (var n in cookies) {
					if (Object.prototype.hasOwnProperty.call(cookies, n)) {
						var options = cookies[n];
						cookie(n, options.value, options.maxAge, options.path, options.domain, options.secure);
					}
				}
			}
		},
		emit: function(uri, data, callback) {
			var mid = 'c_' + (++this._muid);
			var cookies = this.getCookies();

			origin.emit('message', JSON.stringify({
				id: mid,
				uri: uri,
				data: data,
				token: window._io_token_,
				cookies: cookies
			}));

			var hasGroupCollapsed = console.debug && console.groupCollapsed;
			if (hasGroupCollapsed && location.href.indexOf('debug=1') > -1) {
				console.groupCollapsed('%c The Sending message :' + uri, 'color: black');
				console.debug('mid is : %s', mid);
				console.debug('uri is : %s', uri);
				console.debug('param is :%o', data);
				console.debug('cookies is :%o', cookies);
				console.groupEnd();
			}

			if (callback) {
				this.$.push([mid, callback]);
			}
		},
		_muid: 1,
		$: [],
		_: [],
		_received: function(message) {
			this.setCookies(message.cookies);

			var hasGroupCollapsed = console.debug && console.groupCollapsed;
			var style = 'background: #18A488; color: white';
			if(hasGroupCollapsed && location.href.indexOf('debug=1') > -1) {
				if(!message.err) {
					console.groupCollapsed('%c The received message: ' + message.uri, style);
					console.debug('mid is : %s', message.rid || message.mid);
					console.debug('uri is : %s', message.uri);
					console.debug('the return data is :%o', message.data);
					console.debug('the cookie set is :%o', message.cookies);
					console.groupEnd();
				} else {
					console.debug('The received error message: ' + message.uri);
					console.error(message.err);
				}
			}

			// emit callback
			for (var j = 0; j < this.$.length; j++) {
				var ritem = this.$[j];
				if (ritem[0] === message.rid) {
					ritem[1](message.err, message.data, message.uri);
					this.$.splice(j--, 1);
				}
			}

			// on callback
			for (var i = 0; i < this._.length; i++) {
				var item = this._[i];
				if (item[0] === message.uri) {
					item[1](message.err, message.data, message.uri);
				}
				if (item[2]) {
					this._.splice(i--, 1);
				}
			}
		}
	}

	origin.on('message', function(message) {
		message = JSON.parse(message);
		// var uri = message.uri;
		// var data = message.data;
		// var id = message.id;
		socket._received(message);
	});

	window.socket = socket;
})();
(function() {
	function ajax(type, url, param, callback) {
		if (typeof param === 'function') {
			callback = param;
			param = null;
		}

		if (url.indexOf('./') === 0) {
			url = url.substr(2);
		}
		if (url.indexOf('/') === 0) {
			url = url.substr(1);
		}

		url = '/ajax/' + url;

		$.ajax({
			url: url,
			data: type == 'post' ? JSON.stringify(param) : param,
			type: type,
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8',
			headers: {
				Accept: 'application/json; charset=UTF-8'
			},
			success: function(data) {
				if (callback) {
					if (data.err) {
						return callback(data.err);
					}
					callback(null, data);
				}
			},
			error: function(xhr, status, err) {
				if (callback) {
					callback(err);
				}
			}
		});
	}

	ajax.get = ajax.bind(ajax, 'get');
	ajax.post = ajax.bind(ajax, 'post');
	ajax.jsonp = ajax.bind(ajax, 'jsonp');
	window.ajax = ajax;
})();
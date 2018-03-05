var express = require('express');
var path = require('path');
var hbs = require('./lib/hbs');
var socket = require('./lib/socket');
var favicon = require('serve-favicon');
var logger = require('morgan');
var debug = require('debug')('socket:server');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');
var util = require('./lib/util');
require('./model');
var _runtime_ = {};

var app = express();
var server = http.createServer(app);
socket.start(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', hbs.__express);


// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(config.path.upload));

// add socket cast
app.use(function(req, res, next) {
	res.broadcast = socket.broadcast.bind(socket);
	next();
});

// merge req.query and req.body to req.data;
// add message method to res
app.use(function(req, res, next) {
	_runtime_.req = req;
	_runtime_.res = res;

	req.data = Object.assign({}, req.body, req.query);
	// type: success|error
	res.message = function(message, type) {
		var tpl = type === 'error' ? 'message/error' : 'message/success';
		res.render(tpl, {
			'layout': 'message/layout',
			'title': type === 'error' ? '抱歉，出错了' : '提示信息',
			'message': message
		});
	}
	next();
});

// add session
var session_map = new Map();
function session_addon(req, res) {
	req.session = {
		// 获取id
		getid: function() {
			var sid = req.cookies['__aao_sid__'];
			console.log('get cookie id: ', sid);
			return sid;
		},
		getinfo: function() {
			var sid = this.getid();
			if (sid) {
				return session_map.get(sid);
			}
		}
	};
	res.session = {
		// 设置id
		setid: function(sid) {
			console.log('write cookie id: ', sid);
			res.cookie('__aao_sid__', sid, { maxAge: 86400*24});
		},
		// 设置信息
		setinfo: function(userinfo) {
			var sid = userinfo.openid;
			this.setid(sid);
			session_map.set(sid, userinfo);
		}
	};
}
app.use(function(req, res, next) {
	session_addon(req, res);
	next();
});

// add internal message
function dispatch_addon(req, res) {
	req.dispatch = function(uri, data) {
		return new Promise(function(resolve, reject) {
			if (uri.indexOf('/') === 0) {
				uri = uri.slice(1);
			}
			var arr = uri.split('/');
			var block = arr[0];
			var module = arr[1];
			var action = arr[2];

			var controller_file = [config.controller_base, block, module].join('/');
			try {
				require.resolve(controller_file);
			} catch(e) {
			}
			var controller = require(controller_file);

			try {
				var ret = controller[action]({
					// 标明为内部通讯
					internal: true,
					path: uri,
					data: data,
					cookies: req.cookies,
					dispatch: req.dispatch
					// 业务用到再补充 ...
				}, {
					broadcast: socket.broadcast.bind(socket),
					end: function(data) {
						resolve(data);
					},
					redirect: function() {
						resolve();
						res.redirect.apply(res, arguments);
					},
					cookie: function() {
						res.cookie.apply(res, arguments);
					}
				});

				if (ret.then) {
					ret.then(resolve).catch(reject);
				} else if (ret) {
					resolve(ret);
				}
			} catch(err) {
				reject(logError('dispatch', uri, data, err));
			}
		});
	}
}
app.use(function(req, res, next) {
	dispatch_addon(req, res);
	next();
});

var _io_token_ = util.token(20);
socket.on('request', function(req, res) {
	_runtime_.req = req;
	_runtime_.res = res;

	session_addon(req, res);
	dispatch_addon(req, res);
	

	var uri = req.uri;
	if (uri.indexOf('/') === 0) {
		uri = uri.slice(1);
	}


	var arr = uri.split('/');
	var block = arr[0];
	var module = arr[1];
	var action = arr[2];

	if (block === 'admin' && req.token !== _io_token_) {
		return res.reply(null, 'token不匹配！');
	}

	var controller = require([config.controller_base, block, module].join('/'));

	if (!controller[action]) {
		return res.reply(null, '找不到处理该路由的方法: ' + uri);
	}
	var ret = controller[action](req, res, true);
	var reply = function(err, data) {
		res.reply(data, err);
		_runtime_.req = null;
		_runtime_.res = null;
	}

	if (ret.then) {
		ret.then(function(result) {
			reply(null, result);
		}).catch(function(err) {
			reply(logError('websocket', uri, req.data, err));
		});
	} else if (!res._isReply) {
		reply(null, ret);
	}
});

// ajax
app.use('/ajax/:block/:module/:action', function(req, res) {
	var block = req.params.block;
	var module = req.params.module;
	var action = req.params.action;

	if (block === 'admin') {
		return {
			err: '请用websocket请求'
		};
	}

	var controller_file = require([config.controller_base, block, module].join('/'));

	try {
		require.resolve(controller_file);
	} catch(e) {
		return res.json({err: '找不到处理该请求的方法'});
	}

	var controller = require(controller_file);
	var ret = controller[action](req, res);
	var reply = function(err, data) {
		if (err) {
			res.json({err: err});
		} else {
			res.json(data);
		}
		_runtime_.req = null;
		_runtime_.res = null;
	}

	if (ret.then) {
		ret.then(function(data) {
			reply(null, data)
		}).catch(function(err) {
			reply(logError('ajax', [block, module, action].join(''), req.data, err));
		});
	} else {
		reply(null, ret);
	}
});

// 微信页面渲染
app.use('/wx/:page/:action?', function(req, res) {
	var page = req.params.page;
	var action = req.params.action || 'index';
	var controller_file = config.controller_base + '/wx/' + page;

	try {
		require.resolve(controller_file);
	} catch(e) {
		return res.message('404 Not Found', 'error');
	}

	var controller = require(controller_file);
	if (!controller[action]) {
		return res.message('404 Not Found', 'error');
	}

	var ret = controller[action](req, res);

	normalReply(ret, 'wx/' + page + '/' + action, 'wx/layout', req, res);
});

// 管理后台页面渲染
var _admin_page_ = config.admin_uri || 'd90df83fb64fb';
app.use('/' + _admin_page_ + '/:page/:action?', function(req, res) {
	var page = req.params.page;
	var action = req.params.action || 'index';
	var controller_file = config.controller_base + '/admin/' + page;

	try {
		require.resolve(controller_file);
	} catch(e) {
		return res.message('404 Not Found', 'error');
	}
	
	var controller = require(controller_file);
	if (!controller[action]) {
		return res.message('404 Not Found', 'error');
	}

	var ret = controller[action](req, res);

	normalReply(ret, 'admin/' + page + '/' + action, 'admin/layout', req, res, {_io_token_: _io_token_, _admin_page_: _admin_page_});
});
app.use('/' + _admin_page_, function(req, res) {
	res.redirect(301, '/' + _admin_page_ + '/user/list');
});

// 大屏幕渲染
app.use('/:page/:action?', function(req, res) {
	var page = req.params.page;
	var action = req.params.action || 'index';
	var controller_file = config.controller_base + '/screen/' + page;
	try {
		require.resolve(controller_file);
	} catch(e) {
		return res.message('404 Not Found', 'error');
	}
	
	var controller = require(controller_file);
	if (!controller[action]) {
		return res.message('404 Not Found', 'error');
	}
 
	var ret = controller[action](req, res);

	normalReply(ret, 'screen/' + page + '/' + action, 'screen/layout', req, res);
});
app.use('/', function(req, res) {
	res.redirect(301, '/wall');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	res.message('404 Not Found', 'error');
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	logError('uncaught', req.originalUrl, '-', err);

	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};


	// render the error page
	res.status(err.status || 500);
	res.render('error/error', {'layout': 'error/layout'});
});

var port = config.port;
app.set('port', port);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/**
 * 业务返回渲染
 */
function normalReply(ret, page, layout, req, res, expand) {
	var callback = function(data) {
		// message
		if (typeof data === 'string') {
			res.message(data, 'success');
		} else if (data) {
			data.layout = layout;
			if (expand) {
				Object.assign(data, expand);
			}
			res.render(page, data);
		}

		_runtime_.req = null;
		_runtime_.res = null;
	}
	if (ret && ret.then) {
		ret.then(callback).catch(function(err) {
			// reject(false) | reject(302)
			if (!err || err !== 302 || err !== 301) {
				res.message(logError('reply', page, '-', err), 'error');
			}
		});
	} else {
		callback(ret);
	}
}

process.on('uncaughtException', function(err) {
	var uri = '';
	if (_runtime_.req) {
		uri = _runtime_.req.originalUrl || _runtime_.req.uri;
	}
	logError('global', uri, '-', err);
});

function logError(type, uri, data, err) {
	var message;
	var stack;

	if (typeof err === 'string') {
		message = err;
	} else {
		message = err.message;
		stack = err.stack;
	}

	process.stdout.write([
		'', 
		'S ===================================================================================================', 
		'type    : ' + type,
		'uri     : ' + uri, 
		'data    : ' + JSON.stringify(data), 
		'message : ' + message, 
		'stack   : ' + stack, 
		'E ===================================================================================================',
		'', 
		''
	].join('\r\n'));

	return message;
}

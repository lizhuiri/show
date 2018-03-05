var SocketIO = require('socket.io');
var EventEmitter = require('events').EventEmitter;

function Socket() {
    this.io = null;
    this._muid = 1;
    EventEmitter.call(this);
}
Socket.prototype.start = function(server) {
    var _this = this;
    var io = this.io = SocketIO(server);
    io.on('connection', function(socket) {
        _this.emit('connection', socket);
        socket.on('message', function(message) {
            message = JSON.parse(message);
            _this.emit('message', message);
            var uri = message.uri;
            var data = message.data;
            var mid = message.id;
            var cookies = message.cookies;
            var token = message.token;

            var req = {
                uri: uri,
                id: mid,
                data: data || {},
                cookies: cookies || {},
                token: token,
                websocket: true
            };

            var res = {
                broadcast: _this.broadcast.bind(_this),
                emit: function(uri, data, err) {
                    this._cookies = {};
                    socket.emit('message', JSON.stringify({
                        'id': 's_' + (++_this._muid),
                        "uri": uri,
                        "data": data,
                        "cookies": this._cookies,
                        "err": err
                    }));
                },
                _cookies: {},
                cookie: function(name, value, options) {
                    if (options.expires && !options.maxAge) {
                        options.maxAge = Math.round((options.expires - Date.now()) / 1e3);
                    }

                    this._cookies[name] = {
                        value: value,
                        maxAge: options.maxAge,
                        path: options.path,
                        domain: options.domain,
                        secure: options.secure
                    };
                },
                _isReply: false,
                reply: function(data, err) {
                    this._isReply = true;
                    this._cookies = {};
                    socket.emit('message', JSON.stringify({
                        'id': 's_' + (++_this._muid),
                        'rid': mid, // response id
                        "uri": uri,
                        "data": data,
                        "cookies": this._cookies,
                        "err": err
                    }));
                }
            };

            _this.emit('request', req, res);
        });
    });
}
Socket.prototype.broadcast = function(uri, data) {
    if (this.io) {
        this.io.sockets.emit('message', JSON.stringify({
            'id': 's_' + (++this._muid),
            'uri': uri,
            'data': data
        }));
    }

    return this;
}

Socket.prototype.__proto__ = EventEmitter.prototype;

module.exports = new Socket();

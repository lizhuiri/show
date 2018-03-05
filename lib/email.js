'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');
/**
 * 邮件发送类
 * @param {Object} options    nodemailer的createTransport传入配置
 * @param {Number} interval   <可选>邮件发送间隔(单位：s)，避免发送过于频繁
 * @param {String} senderName <可选>发送人名称
 *
 * options: {
 *     host: 'smtp.exmail.qq.com', // smtp主机
 *     port: 465, // smtp端口
 *     secure: true, // 使用SSL
 *     auth: {
 *         user: '', // 账号
 *         pass: ''  // 密码
 *     }
 * }
 * 具体可参照nodemailer文档， https://nodemailer.com
 * 需要注意：
 * 发送邮件时的发件人需要和配置的账号一致
 *
 */
function Email(options, interval, senderName) {
    if (!(this instanceof Email)) {
        return new Email(options, interval);
    }

    // 处理发件人名称
    this.sender = '';
    if (senderName) {
        this.sender += '"' + senderName + '"';
    }
    this.sender += options.auth.user;

    // 实例
    this.transporter = nodemailer.createTransport(options);
    this.interval = interval || 30;

    // 队列
    this.busy = false;
    this._ = [];

    this.isClose = options.close;
}

/**
 * 发送邮件
 * @param  {String}  receivers   收件人，多个用英文逗号分隔
 * @param  {Number}  tplcode     模板名称（不需要写后缀名）
 * @param  {Object}  viewModel   要替换模板的数据模型
 * @param  {Boolean} bodyUseHtml 内容内是否包含html
 */
Email.prototype.send = function(receivers, email) {
    if(this.isClose) {
        util.log(2, '邮件通知已关闭!');
        return;
    } 
    var mailOptions = {
        'from': '舜飞年会委员会 <' + this.sender + '>',
        'to': receivers,
    };
    mailOptions.subject = email.title;
    mailOptions.html = email.body;
    this._.push(mailOptions);
    this._runQueue();
};

Email.prototype._runQueue = function() {
    if (!this.busy && this._.length) {
        this.busy = true;
        setTimeout(
            (function() {
                this.busy = false;
                this._runQueue();
            }).bind(this),
            this.interval * 1e3
        )

        this.transporter.sendMail(this._.shift(), function(error, info) {

        });
    }
};
module.exports = new Email(config.email);

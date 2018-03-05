/**
 * ============================
 * 员工管理
 */
'use strict'

var model = require('../../model');
var User = model.User;
var OneTimeStatus = model.OneTimeStatus;
var hbs = require('hbs');
var config = require('../../config');

// 列表
exports.list = function(req, res) {
	// 列表分页
	var page = Number(req.data.page) || 1;
	var limit = 30;
	var pages = 0;
	var pageAry = [];
    var search = req.data.search;

    var query = {
        guest: false
    };

    if (search) {
        query.$or = [
            {name: model.getMongoRegx(search)},
            {email: model.getMongoRegx(search)}
        ];
    }

	return Promise.all([
        User.count(query), 
        User.count({openid: null}), 
        User.count({signed: false})
    ]).then(function(values) {
        var count = values[0];
        var unregistered_count = values[1];
        var unsigned_count = values[2];
		// 总页数
		pages = Math.ceil(count/limit);
		// page不超过pages且大于1
		page = Math.min(page, pages);
		page = Math.max(page, 1);

		for (let i=0; i<pages; i++) {
			pageAry.push(i);
		}

		var skip = (page -1)*limit;

		return Promise.all([
            User.find(query).limit(limit).skip(skip),
            OneTimeStatus.findOne({ skey: 'is_sendEmail' })
        ]) .then(function(values) {
			return {
                title: '员工签到列表',
                unregistered_count: unregistered_count,
                unsigned_count: unsigned_count,
                users: values[0],
                count: count,
				pages: pages,
				limit: limit,
				page : page, 
                pageAry: pageAry,
                search: search || '',
                hasSendEmail: values[1]? values[1].svalue : values[1]
			};
		});
	});
}



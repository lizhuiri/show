/**
 * ============================
 * 员工管理
 */
'use strict'

var model = require('../../model');
var User = model.User;
var OneTimeStatus = model.OneTimeStatus;
var staff = require('../../config/staff');
var hbs = require('hbs');
var node_emailer = require('../../lib/email');
var config = require('../../config');
const emaliTpl = {
    title: '不要与大奖擦身而过~~!',
    body: `
		<p>本次年会，我们将使用<b style="color: #ff9900">系统实名制</b>抽奖，赶紧扫二维码注册，上传你的个人照片，千万别与大奖插身而过哦！</p>
        <p><b style="color:#ed3f14">注意:</b>照片必须是个人单人照，不能上传动画、孩子、朋友合照等其他无关照片；不及格照片将不能参与大奖哦~~</p>
        <p>如二维码不能显示，请点击<a href="${config.host}/wx/reg/qr?ticket={{ticket}}">二维码跳转链接</a></p>
		<div style="width: 300px; height: 300px;">
			<img width=100% height=100% src="${config.host}/wx/reg/qr?ticket={{ticket}}">
        </div>
		<hr size="1" />
<div><b style=" color: rgb(51, 51, 51) ; "><table cellspacing="0" border="0" class="" style="color: rgb(117, 117, 117); font-size: 13px; line-height: 22px;"><tbody><tr><td><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; line-height: 15.75pt;"><font color="#404040" size="3"><b>舜飞行政部 &nbsp;</b></font></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; line-height: 15.75pt;"><br></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">E-mail</span><span style="color: rgb(89, 89, 89); font-size: 12px;">:</span><span style="color: rgb(89, 89, 89); font-size: 12px;">&nbsp;adm@sunteng.com</span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span style="color: rgb(89, 89, 89); font-size: 12px;">Website: www.sunteng.com</span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><br></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><b><span style="font-size: 9pt; color: rgb(0, 176, 80);">舜飞科技</span></b><b><span lang="EN-US" style="font-size: 9pt; color: rgb(0, 176, 80);">&nbsp;Sunteng Technology<o:p></o:p></span></b></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span style="font-size: 9pt; color: rgb(89, 89, 89);">北京</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">·</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;朝阳区</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">东三环中路富力中心</span><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">1915<o:p></o:p></span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span style="font-size: 9pt; color: rgb(89, 89, 89);">上海</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">·</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;长宁区</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">愚园路</span><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">1107</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">号弘基创邑国际园</span><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">4楼R16<o:p></o:p></span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span style="font-size: 9pt; color: rgb(89, 89, 89);">广州</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">·</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">&nbsp;</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">天河区棠东东路</span><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">3-5</span><span style="font-size: 9pt; color: rgb(89, 89, 89);">号远洋创意园</span><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);">B-420</span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><span lang="EN-US" style="font-size: 9pt; color: rgb(89, 89, 89);"><img src="https://exmail.qq.com/cgi-bin/viewfile?type=signature&amp;picid=ZX0628-5nQbkGbxMfaM_k0UVTlzC7j&amp;uin=3016226450"></span></p><p class="MsoNormal" style="margin: 0cm 0cm 0.0001pt; font-size: 12pt; line-height: 15.75pt;"><img modifysize="100%" norescale="true" style="max-width: inherit;"></p></td></tr></tbody></table></b></div>
		`
};

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

// 添加渲染
exports.add = function(req, res) {
    return {
        title: '员工信息录入'
    };
}

// 添加提交
exports.onAdd = function(req, res, is_socket) {
    var useName = req.data.name;
    var userEmail = req.data.email;
    var isSendEmail = req.data.isSendEmail;
    if(useName && userEmail) {
        return User.findOne({ email: userEmail }).then(function(user) {
            if (user) {
                return Promise.reject("email已存在：" + userEmail);
            } else {
                var user = new User({
                    name: useName,
                    email: userEmail
                })
                return user.save().then(function(user) {
                    if (isSendEmail) {
                        var con = {
                            title: emaliTpl.title,
                            body: emaliTpl.body.replace(/\{\{ticket\}\}/g, user.ticket)
                        }
                        node_emailer.send(user.email, con);
                    }
                    return user;
                });
            }
        });
    }else {
        return false;
    }
}

// 导入员工
exports.import = function() {
    var nameMap = new Map();
    var emailMap = new Map();

    var ret = [];

    for (let item of staff) {
        if (emailMap.has(item.email)) {
            ret.push(item.email);
        } else {
            emailMap.set(item.email, 1);
        }
    }

    if (ret.length) {
        return '存在邮箱重复：' + ret.join(' | ');
    } else {
        var promises = [];
        for (let item of staff) {
            var user = new User({
                name: item.name,
                email: item.email
            });
            promises.push(user.save())
        }
        return Promise.all(promises).then(function(users) {
            return '成功导入' + users.length + '个员工！';
        });
    }
}

exports.testEmail = function(req, res) {
	var con = {
		title: emaliTpl.title,
		body: emaliTpl.body.replace(/\{\{ticket\}\}/g, 'eGssPMOC1sghQsQUqkRq')
	}
	node_emailer.send('tanrongmian@sunteng.com', con);
	return '测试邮件已发送';
}

exports.sendEmail = function(req, res) {
    return OneTimeStatus.findOne({ skey: 'is_sendEmail' })
    .then(function(value) {
        if(!value || !value.svalue) {
            return Promise.all([
                User.find({ guest: false }),
                OneTimeStatus.findOneAndUpdate({ skey: 'is_sendEmail' }, { $set: { skey: 'is_sendEmail', svalue: true } }, {upsert: true, new: true})
            ]).then(function(values) {
                var list = values[0];
                var emailStatus = values[1];
                function feach(user, i) {
                    var con = {
                        title: emaliTpl.title,
                        body: emaliTpl.body.replace(/\{\{ticket\}\}/g, user.ticket)
                    }
                    node_emailer.send(user.email, con);
                }
                list.forEach(feach);
                return emailStatus;
            })
        }else {
            return Promise.reject('邮件仅能发送一次');
        }
    })
}

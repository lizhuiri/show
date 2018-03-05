"use strict";

// 生成 token 函数
exports.token = function(size, code){
	var chars = code || 'ABCDEFGHIJKLNMOPQRSTUVWXYZabcdefghijklnmopqrstuvwxyz0123456789';
	var token = '';
	var len = chars.length;
	while (size-- > 0){
		token += chars.charAt(Math.floor(Math.random() * len));
	}
	return token;
};

// 数组随机
// 默认会把随的数删除，可通过keep保留
exports.array_random = function(arr, keep) {
	var index = Math.floor(Math.random() * arr.length);

	var value = arr[index];
	if (!keep) {
		arr.splice(index, 1);
	}

	return value;
}

// 数组对象查找
exports.find = function(arr, value, field) {
	if (arr) {
		for (let item of arr) {
			if (!field && value === item || item[field] === value) {
				return item;
			}
		}
	}

	return null;
}

// mongoose find出来的文档toJSON方法
exports.mongooseDocs2JSON = function(docs) {
	return [].slice.call(docs).map(function(item) {
		return item.toJSON();
	});
}

function isNumber(obj) {
    return !isNaN(parseFloat(obj)) && isFinite(obj);
}

function isDate(obj) {
    return Object.prototype.toString.call(obj).indexOf('Date]') > -1;
}

/**
 * 数字或字符串前面补0
 *
 * @export
 * @param {(number|string)} num
 * @param {number} length
 * @returns
 */
exports.fix0 = function (num, length) {
    num = String(num);
    while (num.length < length) {
        num = '0' + num;
    }
    return num;
}


exports.toDate = function(timestamp) {
    var date;
    if (isNumber(timestamp) && String(timestamp).length == 10) {
        timestamp = timestamp * 1e3;
    }

    if (isNumber(timestamp)) {
        date = new Date();
        date.setTime(timestamp);
    } else if (isDate(timestamp)) {
        date = new Date((timestamp).getTime());
    } else {
        date = new Date();
    }

    return date;
}

// 日期格式化
var date_format_reg = /[YymndjNwaAghGHis]/g;
function format_callback(t, tag) {
	switch (tag){
		case 'Y': return t.getFullYear();
		case 'y': return t.getFullYear() % 100;
		case 'm': return exports.fix0(t.getMonth()+1, 2);
		case 'n': return t.getMonth()+1;
		case 'd': return exports.fix0(t.getDate(), 2);
		case 'j': return t.getDate();
		case 'N': return t.getDay();
		case 'w': return t.getDay() % 7;
		case 'a': return t.getHours() < 12 ? 'am':'pm';
		case 'A': return t.getHours() < 12 ? 'AM':'PM';
		case 'g': return t.getHours() % 12;
		case 'h': return exports.fix0(t.getHours() % 12, 2);
		case 'G': return t.getHours();
		case 'H': return exports.fix0(t.getHours(), 2);
		case 'i': return exports.fix0(t.getMinutes(), 2);
		case 's': return exports.fix0(t.getSeconds(), 2);
	}
	return tag;
}
/**
 * 日期格式化
 *
 * @export
 * @param {(number|Date)} timestamp
 * @param {string} format
 * @returns
 */
exports.date =  function(timestamp, format) {
    var date = exports.toDate(timestamp);
    return format.replace(date_format_reg, format_callback.bind(null, date));
}

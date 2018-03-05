var util = require('./util');
var hbs = require('hbs');

hbs.registerHelper('expression', function() {
	var exps = [];
	try {
		var arg_index = arguments.length - 1;
		for (var j = 0; j < arg_index; j++) {
			exps.push(arguments[j]);
		}

		var result = eval(exps.join(' '));

		return result;
	} catch (e) {
		throw new Error('Handlerbars Helper "expression" can not deal with wrong expression:' + exps.join(' '));
	}
});

hbs.registerHelper('date', function(time) {
	if (!time) {
		return '-'
	}
	return util.date.apply(util, arguments);
});

hbs.registerHelper('compare', function() {
	var exps = [];
	try {
		var arg_index = arguments.length - 1;
		for (var j = 0; j < arg_index; j++) {
			exps.push(arguments[j]);
		}

		var result = eval(exps.join(' '));

		// block expression;
		if (result) {
			return arguments[arg_index].fn(this);
		} else {
			return arguments[arg_index].inverse(this);
		}

	} catch (e) {
		throw new Error('Handlerbars Helper "compare" can not deal with wrong expression:' + exps.join(' '));
	}
});

hbs.registerHelper('json', function() {
	return new hbs.SafeString(JSON.stringify(arguments[0]));
});

module.exports = hbs;
var _ 		= require('underscore');
var q 		= require('q');

var mysqhelp = require('../lib/mysqhelp');


function standardizeLocale (locale) {
	if (!locale) {
		return null;
	}

	var m = /^(\w+)(?:\W|_)(\w+)$/.exec(locale.trim());

	if (m) {
		return m[1].toLowerCase() + '_' + m[2].toUpperCase();
	} else {
		return null;
	}
}

function standardizeLanguage (language) {

	language = _.clone(language);

	language.locale = standardizeLocale(language.locale);

	if (!language.locale) {
		return null;
	}

	if (!language.name) {
		return null;
	}

	language.name = language.name.trim();

	return language;
}

function addLanguage (connection, language) {
	language = standardizeLanguage(language);

	if (!language) {
		return q.reject('Invalid language.');
	}

	return mysqhelp.upsert(connection, 'Language', _.pick(language, 'locale'), _.omit(language, 'locale'));
}

function findLanguage (connection, locale) {
	locale = standardizeLocale(locale);
	if (!locale) {
		return q.reject('Invalid locale format!');
	}
	return mysqhelp.query(connection, 'SELECT * FROM Language WHERE ?', [{locale: locale}]).get(0);
}

exports.standardizeLanguage = standardizeLanguage;
exports.standardizeLocale = standardizeLocale;
exports.addLanguage = addLanguage;
exports.findLanguage = findLanguage;
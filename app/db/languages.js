var _ 		= require('underscore');
var q 		= require('q');

var mysqhelp = require('../lib/mysqhelp');

/**
 * For details on plural rules: https://developer.mozilla.org/en-US/docs/Mozilla/Localization/Localization_and_Plurals
 */

function normalizeLocale (locale) {
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

function normalizeLanguage (language) {

	language = _.clone(language);

	language.locale = normalizeLocale(language.locale);

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
	language = normalizeLanguage(language);

	if (!language) {
		return q.reject('Invalid language.');
	}

	return mysqhelp.upsert(connection, 'Language', _.pick(language, 'locale'), _.omit(language, 'locale'));
}

function findLanguage (connection, locale) {
	locale = normalizeLocale(locale);
	if (!locale) {
		return q.reject('Invalid locale format!');
	}
	return mysqhelp.query(connection, 'SELECT * FROM Language WHERE ?', [{locale: locale}]).get(0);
}

exports.normalizeLanguage = normalizeLanguage;
exports.normalizeLocale = normalizeLocale;
exports.addLanguage = addLanguage;
exports.findLanguage = findLanguage;
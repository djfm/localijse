var _ 		= require('underscore');
var q 		= require('q');

var mysqhelp = require('../lib/mysqhelp');
var cldr     = require('../cldr/cldr');

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

	language.n_plurals = +language.n_plurals > 0 ? +language.n_plurals : 2;
	language.plural_rule = +language.plural_rule > 0 ? +language.plural_rule : null;

	language.name = language.name.trim();

	return language;
}

function addLanguage (connection, lang) {
	var language = normalizeLanguage(lang);

	if (!language) {
		throw new Error('Invalid language: ' + JSON.stringify(lang));
	}

	return mysqhelp.upsert(
		connection,
		'Language',
		_.pick(language, 'locale'),
		_.omit(language, 'locale', 'plurals')
	).then(function (language_id) {
		var plurals = [{
			language_id: language_id,
			is_plural: 0,
			plurality: 0
		}];

		for (var i = 0; i < language.n_plurals; i++) {
			plurals.push({
				language_id: language_id,
				is_plural: 1,
				plurality: i + 1
			});
		}

		return plurals.reduce(function (soFar, entry) {
			return soFar.then(function () {
				return mysqhelp.insertIgnore(connection, 'Plural', entry);
			});
		}, q(null)).then(function () {
			return language_id;
		});
	});
}

function findLanguage (connection, locale) {
	locale = normalizeLocale(locale);
	if (!locale) {
		return q.reject('Invalid locale format!');
	}
	return mysqhelp.query(
		connection,
		'SELECT * FROM Language WHERE ?',
		[{locale: locale}]
	).get(0).then(function (language) {
		return mysqhelp.query(
			connection,
			'SELECT is_plural, plurality FROM Plural WHERE language_id = ? ORDER BY is_plural, plurality',
			[language.id]
		).then(function (rows) {
			language.plurals = _.map(rows, function (row) {
				return [row.is_plural, row.plurality];
			});
			return language;
		});
	});
}

function countLanguages (connection) {
	return mysqhelp.query(connection, 'SELECT count(*) as n FROM Language').get(0).get('n');
}

function loadLanguagesIfTableEmpty (connection) {
	return countLanguages(connection)
	.then(function (n) {
		if (n === 0) {
			return cldr.loadLanguages().then(function (languages) {
				return languages.reduce(function (soFar, language) {
					return soFar.then(function () {
						return addLanguage(connection, language);
					});
				}, q(null)).then(function () {
					return true;
				});
			});
		} else {
			return false;
		}
	});
}

exports.normalizeLanguage = normalizeLanguage;
exports.normalizeLocale = normalizeLocale;
exports.addLanguage = addLanguage;
exports.findLanguage = findLanguage;
exports.countLanguages = countLanguages;
exports.loadLanguagesIfTableEmpty = loadLanguagesIfTableEmpty;
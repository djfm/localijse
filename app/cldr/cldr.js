var fs = require('fs');
var http = require('http');
var p = require('path');
var q = require('q');
var request = require('request');
var unzip = require('unzip');
var _ = require('underscore');

var cldrZipURL = 'http://unicode.org/Public/cldr/latest/json-full.zip';
var dataDir = p.join(__dirname, 'data');
var mainDir = p.join(dataDir, 'main');
var supplementalDir = p.join(dataDir, 'supplemental');

function downloadArchive () {
	var d = q.defer();

	try {
		fs.exists(mainDir, function (exists) {
			if (exists) {
				d.resolve();
			} else {
				request(cldrZipURL).pipe(unzip.Extract({
					path: dataDir
				})).on('close', function () {
					d.resolve();
				});
			}
		});
	} catch (e) {
		d.reject(e);
	}

	return d.promise;
}

var enLanguages;

function getEnLanguages () {

	if (!enLanguages) {
		var d = q.defer();
		fs.readFile(p.join(mainDir, 'en', 'languages.json'), function (err, data) {
			if (err) {
				d.reject(err);
			} else {
				d.resolve(
					JSON.parse(data.toString()).main.en.localeDisplayNames.languages
				);
			}
		});

		enLanguages = d.promise;
	}

	return enLanguages;
}

var plurals;

function getPlurals () {
	if (!plurals) {
		var d = q.defer();
		fs.readFile(p.join(supplementalDir, 'plurals.json'), function (err, data) {
			if (err) {
				d.reject(err);
			} else {
				d.resolve(
					JSON.parse(data.toString()).supplemental['plurals-type-cardinal']
				);
			}
		});

		plurals = d.promise;
	}

	return plurals;
}

function getEnglishName (locale, lang) {
	return getEnLanguages().then(function (names) {
		if (names[locale]) {
			return names[locale];
		} else if (names[lang]) {
			return names[lang];
		} else {
			throw new Error("Unknown language: " + locale);
		}
	});
}

function getLocalName (locale, lang) {

	function search (code) {
		var d = q.defer();

		var path = p.join(mainDir, code, 'languages.json')

		fs.exists(path, function (yes) {
			if (yes) {
				fs.readFile(path, function (err, data) {
					if (err) {
						d.reject(err);
					} else {
						var names = JSON.parse(data.toString()).main[code].localeDisplayNames.languages;
						if (names[locale]) {
							d.resolve(names[locale]);
						} else if (names[lang]) {
							d.resolve(names[lang]);
						} else {
							d.reject("Could not find local name for: " + locale);
						}
					}
				});
			} else {
				d.reject("Could not find: " + path);
			}
		});

		return d.promise;
	}

	return search(locale).fail(function () {
		return search(lang);
	});
}

function getName (locale, lang) {
	return getEnglishName(locale, lang).then(function (enName) {
		return getLocalName(locale, lang).then(function (loName) {
			return loName + " (" + enName + ")";
		});
	});
}

function loadLanguage (locale, lang, supp) {
	var language = {
		locale: locale
	};

	return q.all([
		getName(locale, lang, supp).then(function (name) {
			language.name = name;
		}),
		getPlurals().then(function (plurals) {
			if (plurals[locale]) {
				language.n_plurals = _.size(plurals[locale]);
			} else if (plurals[lang]) {
				language.n_plurals = _.size(plurals[lang]);
			} else {
				language.n_plurals = null;
			}
		})
	]).then(function () {
		return language;
	});
}

function listLanguages () {
	var d = q.defer();


	fs.readdir(mainDir, function (err, entries) {

		if (err) {
			d.reject(err);
		} else {
			var pending = [];
			_.each(entries, function (entry) {
				var m = /^(\w+)(?:\-([a-zA-Z]+))?$/.exec(entry);
				if (m) {
					pending.push(loadLanguage(m[0], m[1], m[2]));
				}
			});
			q.all(pending).then(d.resolve, d.reject);
		}
	});

	return d.promise;
}

function loadLanguages () {

	return downloadArchive().then(function () {
		return listLanguages();
	});
}

exports.loadLanguages = loadLanguages;


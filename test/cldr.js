require('chai').should();

var cldr = require('../app/cldr/cldr');

/* global describe, it */

describe('CLDR', function () {
	it('Should find all languages, and extract their n_plurals value', function (done) {
		cldr.loadLanguages().then(function (data) {
			// just check a few entries are there, should be enough 
			data.should.include({ locale: 'fr-FR', n_plurals: 2, name: 'français (French)' });
			data.should.include({ locale: 'sr-Cyrl', n_plurals: 3, name: 'српски (Serbian)' });
			data.should.include({ locale: 'uk-UA', n_plurals: 4, name: 'українська (Ukrainian)' });
			done();
		}, function (err) {
			done(err);
		});
	});
});
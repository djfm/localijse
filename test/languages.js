/* global describe, before, it */

var chai = require('chai'), expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.should();

var languages = require('../app/db/languages');

var localijse = require('../app/localijse').init('test');

describe("Languages", function () {
	before(localijse.resetDatabase);

	it("should standardize locale", function () {
		languages.standardizeLocale('fr-fr').should.equal('fr_FR');
		languages.standardizeLocale('fr_fr').should.equal('fr_FR');
		languages.standardizeLocale('FR_fr').should.equal('fr_FR');
		languages.standardizeLocale('FR+fr').should.equal('fr_FR');
		languages.standardizeLocale('FR:fr').should.equal('fr_FR');
		languages.standardizeLocale(' FR:fr ').should.equal('fr_FR');

		expect(languages.standardizeLocale('FR')).to.equal(null);
	});

	it("should standardize language", function () {
		languages.standardizeLanguage({
			locale: 'fr-fr',
			name: ' Français (French) '
		}).should.deep.equal({
			locale: 'fr_FR',
			name: 'Français (French)'
		});

		expect(languages.standardizeLanguage({
			name: ' Français (French) '
		})).to.equal(null);

		expect(languages.standardizeLanguage({
			locale: 'Fr-fr'
		})).to.equal(null);

		expect(languages.standardizeLanguage({
			locale: 'fr',
			name: 'Français'
		})).to.equal(null);
	});

	it("should create a language", function (done) {
		localijse.addLanguage({
			locale: 'fr-fr',
			name: ' Français (French) '
		}).should.become(1).notify(done);
	});

	it("and then find it", function (done) {
		localijse.findLanguage('fr:Fr').get('locale').should.become('fr_FR').notify(done);
	});

	it("should update a language", function (done) {
		localijse.addLanguage({
			locale: 'fr-fr',
			name: ' Français'
		})
		.then(function (languageId) {
			languageId.should.equal(1);
		})
		.then(localijse.findLanguage.bind(undefined, 'fr:fr'))
		.get('name').should.become('Français').notify(done);
	});
});
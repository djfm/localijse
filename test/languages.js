/* global describe, before, it */

var chai = require('chai'), expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.should();

var languages = require('../app/db/languages');

var localijse = require('../app/localijse').init('test');

describe("Languages", function () {
	before(localijse.resetDatabase);

	it("should normalize locale", function () {
		languages.normalizeLocale('fr-fr').should.equal('fr_FR');
		languages.normalizeLocale('fr_fr').should.equal('fr_FR');
		languages.normalizeLocale('FR_fr').should.equal('fr_FR');
		languages.normalizeLocale('FR+fr').should.equal('fr_FR');
		languages.normalizeLocale('FR:fr').should.equal('fr_FR');
		languages.normalizeLocale(' FR:fr ').should.equal('fr_FR');

		expect(languages.normalizeLocale('FR')).to.equal(null);
	});

	it("should normalize language", function () {
		languages.normalizeLanguage({
			locale: 'fr-fr',
			name: ' Français (French) '
		}).should.deep.equal({
			locale: 'fr_FR',
			name: 'Français (French)',
			n_plurals: 2,
			plural_rule: null
		});

		expect(languages.normalizeLanguage({
			name: ' Français (French) '
		})).to.equal(null);

		expect(languages.normalizeLanguage({
			locale: 'Fr-fr'
		})).to.equal(null);

		expect(languages.normalizeLanguage({
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
		.then(localijse.findLanguage.bind(undefined, 'fr:fr'))
		.get('name').should.become('Français').notify(done);
	});

	it("should store plural_rule, n_plurals, and create Plural entries", function (done) {
		localijse.addLanguage({
			locale: 'zz_ZZ',
			name: 'Made Up',
			plural_rule: 1,
			n_plurals: 2
		}).then(function () {
			return localijse.findLanguage('zz-zz');
		}).then(function (language) {
			language.plural_rule.should.equal(1);
			language.n_plurals.should.equal(2);
			language.plurals.should.deep.equal([[0,0], [1, 1], [1, 2]]);
			done();
		})
		.fail(done);
	});

	describe("Autoloading", function () {
		before(localijse.resetDatabase);

		it("should load the languages taking the data from the CLDR", function (done) {

			this.timeout(15000);

			localijse.loadLanguagesIfTableEmpty()
			.then(localijse.countLanguages)
			.should.eventually.be.above(100).notify(done);
		});

		it("should not load the languages if they're here already", function (done) {
			localijse.loadLanguagesIfTableEmpty()
			.should.eventually.equal(false).notify(done);
		});
	});
});
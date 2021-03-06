/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe("Translations", function () {
	before(localijse.resetDatabase);
	before(function () {
		return localijse.addLanguage({
			locale: 'fr_FR',
			name: 'Français (French)'
		});
	});
	before(function () {
		return localijse.addLanguage({
			locale: 'zz_ZZ',
			name: 'Imaginaire (Made-up)',
			plural_rule: 1,
			n_plurals: 2
		});
	});

	var contextualized_message_id, user;
	
	var messages = [{
		path: 'Vendor/FirstProject/V1/Admin',
		context: 'title',
		message: 'Welcome!'
	},{
		path: 'Vendor/FirstProject/V1/Admin',
		context: 'button',
		message: 'Save'
	},{
		path: 'Vendor/FirstProject/V2/Admin',
		context: 'title',
		message: 'Welcome!'
	},{
		path: 'Vendor/SecondProject/V1/Front',
		is_plural: 1,
		context: 'zoology',
		message: 'animals'
	}];

	before(function () {
		return localijse.addUser({username: 'testUser'})
		.then(function (u) {
			user = u;
			user.setAlmighty(true);
		})
		.then(function () {
			return localijse.updateMessages(messages);
		})
		.then(function () {
			return localijse.find({
				path: 'Vendor/FirstProject/'
			});
		}).then(function (paginator) {
			paginator.retrievedCount.should.equal(2);
			paginator.hits[0].message.should.equal("Welcome!");
			contextualized_message_id = paginator.hits[0].contextualized_message_id;
		});
	});

	it("should add a translation to a message missing a translation", function (done) {
		localijse.addTranslation(user, contextualized_message_id, {
			locale: 'fr_FR',
			translation: 'Bienvenue !',
			mappingStatus: 'imported'
		})
		.then(function () {
			return localijse.find({
				path: 'Vendor',
				message: 'Welcome!',
				hasTranslation: true,
				locale: 'fr_FR'
			});
		})
		.get("hits").get(0).get('translation').should.become('Bienvenue !')
		.notify(done);
	});

	it("should not find unexisting message (with translation)", function (done) {
		localijse.find({
			path: 'Vendor',
			message:'Not existing!',
			hasTranslation: true,
			locale: 'fr_FR'
		}).get('totalCount').should.become(0).notify(done);
	});

	it("should not find unexisting message (without translation)", function (done) {
		localijse.find({
			path: 'Vendor',
			message:'Not existing!',
			hasTranslation: false,
			locale: 'fr_FR'
		}).get('totalCount').should.become(0).notify(done);
	});

	it("should add a translation to a message with a previous translation", function (done) {
		localijse.addTranslation(user, contextualized_message_id, {
			locale: 'fr_FR',
			translation: 'Bienvenue 2!',
			mappingStatus: 'imported'
		})
		.then(function () {
			return localijse.find({
				path: 'Vendor',
				message: 'Welcome!',
				hasTranslation: true,
				locale: 'fr_FR'
			});
		})
		.get("hits").get(0).get('translation').should.become('Bienvenue 2!')
		.notify(done);
	});

	it("should only find one translation, because there is just one (with 2 versions)", function (done) {
		localijse.find({
			path: 'Vendor/FirstProject/V1',
			hasTranslation: true,
			locale: 'fr_FR'
		}).get('totalCount').should.become(1).notify(done);
	});

	it("should find one message missing a translation in French", function (done) {
		localijse.find({
			path: 'Vendor/FirstProject',
			hasTranslation: false,
			locale: 'fr_FR'
		}).then(function (paginator) {
			paginator.totalCount.should.equal(1);
			paginator.hits[0].message.should.equal('Save');
			done();
		}).fail(done);
	});

	var zz;

	it("should find 1 plural message missing all translations in Made-up (that requires 2 plurals)", function (done) {
		localijse.find({
			path: 'Vendor/SecondProject',
			hasTranslation: false,
			locale: 'zz_ZZ'
		}).then(function (paginator) {
			paginator.totalCount.should.equal(1);
			paginator.hits[0].message.should.equal('animals');
			zz = paginator.hits[0].contextualized_message_id;
			done();
		}).fail(done);
	});

	it("should find 1 plural message missing 1 translation in Made-up (that requires 2 plurals)", function (done) {
		localijse.addTranslation(user, zz, {
			locale: 'zz_ZZ',
			translation: 'animaux',
			mappingStatus: 'translated',
			plurality: 2
		}).then(function () {
			return localijse.find({
				path: 'Vendor/SecondProject',
				hasTranslation: false,
				locale: 'zz_ZZ'
			});
		}).then(function (paginator) {
			paginator.totalCount.should.equal(1);
			paginator.hits[0].message.should.equal('animals');
			done();
		}).fail(done);
	});

	it("should find no plural message missing translation in Made-up (that requires 2 plurals)", function (done) {
		localijse.addTranslation(user, zz, {
			locale: 'zz_ZZ',
			translation: 'animaux',
			mappingStatus: 'translated',
			plurality: 1
		}).then(function () {
			return localijse.find({
				path: 'Vendor/SecondProject',
				hasTranslation: false,
				locale: 'zz_ZZ'
			});
		}).then(function (paginator) {
			paginator.totalCount.should.equal(0);
			done();
		}).fail(done);
	});


});
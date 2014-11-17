/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe.only("Translations", function () {
	before(localijse.resetDatabase);
	before(function () {
		return localijse.addLanguage({
			locale: 'fr_FR',
			name: 'Français (French)'
		});
	});

	var contextualized_message_id, user;
	
	before(function () {
		return localijse.addUser({username: 'testUser'})
		.then(function (u) {
			user = u;
			user.setAlmighty(true);
		})
		.then(function () {
			return localijse.updateMessages([{
				path: 'Vendor/FirstProject/SomeVersion/Admin',
				context: 'title',
				message: 'Welcome!'
			}]);
		})
		.then(function () {
			return localijse.find({
				path: 'Vendor/FirstProject/SomeVersion/Admin'
			});
		}).then(function (paginator) {
			paginator.retrievedCount.should.equal(1);
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
			}).then(function (paginator) {
				paginator.hits[0].translation.should.equal('Bienvenue !');
			});
		})
		.then(done.bind(undefined, null))
		.fail(function (err) {
			done(err);
		});
	});

	it("should not find unexisting message", function (done) {
		localijse.find({
			path: 'Vendor',
			message:'Not existing!',
			hasTranslation: true,
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
			}).then(function (paginator) {
				paginator.hits[0].translation.should.equal('Bienvenue 2!');
			});
		})
		.then(done.bind(undefined, null))
		.fail(function (err) {
			done(err);
		});
	});

	it("should only find one translation, because there is just one (with 2 versions)", function (done) {
		localijse.find({
			path: 'Vendor',
			hasTranslation: true,
			locale: 'fr_FR'
		}).get('totalCount').should.become(1).notify(done);
	});
});
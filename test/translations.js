/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var users 			= require('../app/auth/users');

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
			return localijse.findMessages({
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
		.then(done.bind(undefined, null))
		.fail(function (err) {
			done(err);
		});
	});
});
/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe.only("Users", function () {
	before(localijse.resetDatabase);

	it("Should create a user", function (done) {
		localijse.addUser({username: 'bob'}).then(done.bind(undefined, undefined)).fail(done);
	});

	it("Should not fail upon addUser if user already exists", function (done) {
		localijse.addUser({username: 'bob'}).then(done.bind(undefined, undefined)).fail(done);
	});
});
/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe("Users", function () {
	before(localijse.resetDatabase);

	it("Should create a user", function (done) {
		localijse.addUser({username: 'bob'}).then(done.bind(undefined, undefined)).fail(done);
	});

	it("Should not fail upon addUser if user already exists", function (done) {
		localijse.addUser({username: 'bob'}).then(done.bind(undefined, undefined)).fail(done);
	});

	it("Should find existing user by username", function (done) {
		localijse.findUser("bob").then(done.bind(undefined, undefined)).fail(done);
	});

	it("Should find existing user by query object", function (done) {
		localijse.findUser({username: "bob"}).then(done.bind(undefined, undefined)).fail(done);
	});

	it("Should not find non existing user", function (done) {
		localijse.findUser({username: "noBob"})
		.then(done.bind(undefined, new Error("User found, should not exist.")))
		.fail(done.bind(undefined, undefined));
	});
});
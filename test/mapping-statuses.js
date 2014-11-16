/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe("Mapping Statuses", function () {
	before(localijse.resetDatabase);

	it("Should reject an invalid status", function (done) {
		localijse.getMappingStatusId("dsfsdgr").fail(done.bind(undefined, undefined));
	});

	it("Should create a mapping status", function (done) {
		localijse.getMappingStatusId("imported").should.become(1).notify(done);
	});

	it("Should create another mapping status", function (done) {
		localijse.getMappingStatusId("reviewed").should.become(2).notify(done);
	});

	it("Should retrieve the same mapping status", function (done) {
		localijse.getMappingStatusId("imported").should.become(1).notify(done);
	});
});
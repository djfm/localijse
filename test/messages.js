/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();
var expect = chai.expect;

var messages = require('../app/db/messages');

var localijse = require('../app/localijse').init('test');

describe("Message standardization", function () {
	it ("Should accept a correctly formed message", function () {
		var message = {
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		};
		messages.standardizeMessage(message).should.deep.equal(message);
	});
	it ("Should reject a message with a too short path", function () {
		/* jshint expr:true */
		expect(messages.standardizeMessage({
			path: ['vendor'],
			context: 'button',
			message: 'Save',
			plurality: null
		})).to.be.null;

		expect(messages.standardizeMessage({
			path: 'vendor/project',
			context: 'button',
			message: 'Save',
			plurality: null
		})).to.be.null;
	});
	it ("Should reject a message missing a valid path", function () {
		/* jshint expr:true */
		expect(messages.standardizeMessage({context: "button", message: "Save"})).to.be.null;
		expect(messages.standardizeMessage({context: "button", message: "Save", path: "a"})).to.be.null;
		expect(messages.standardizeMessage({context: "button", message: "Save", path: ["a"]})).to.be.null;
		expect(messages.standardizeMessage({context: "button", message: "Save", path: true})).to.be.null;
		expect(messages.standardizeMessage({context: "button", message: "Save", path: {}})).to.be.null;
	});
	it ("Should reject a message missing a valid message", function () {
		/* jshint expr:true */
		expect(messages.standardizeMessage({context: "button", path: ['vendor', 'project']})).to.be.null;
		expect(messages.standardizeMessage({context: "button", path: ['vendor', 'project'], message: true})).to.be.null;
	});
	it ("Should transform a path expressed as a string", function () {
		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save'
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save'
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		});
	});

	it ("Should normalize plurality", function () {
		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save'
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: 1
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: 1
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: false
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: 42
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: 2
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: 0
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: null
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: true
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: 1
		});

		messages.standardizeMessage({
			path: 'vendor/project/version',
			context: 'button',
			message: 'Save',
			plurality: {}
		}).should.deep.equal({
			path: ['vendor', 'project', 'version'],
			context: 'button',
			message: 'Save',
			plurality: 1
		});
	});
});

describe("Messages update", function () {
	before(localijse.resetDatabase);

	it ("should add just one message", function (done) {
		localijse.updateMessages([{
			path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
			context: 'button',
			message: 'save'
		}]).then(function () {
			return localijse.findMessages({
				path: 'PrestaShop'
			});
		}).then(function (paginator) {
			paginator.totalCount.should.equal(1);
			done();
		}).fail(function (err) {
			done(err);
		});
	});
});
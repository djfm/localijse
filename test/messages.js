/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();
var expect = chai.expect;

var messages = require('../app/db/messages');

var localijse = require('../app/localijse').init('test');

describe("Messages", function () {

	describe("Message standardization", function () {
		it("Should accept a correctly formed message", function () {
			var message = {
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			};
			messages.normalizeMessage(message).should.deep.equal(message);
		});
		it("Should reject a message with a too short path (< 3)", function () {
			/* jshint expr:true */
			expect(messages.normalizeMessage({
				path: ['vendor'],
				context: 'button',
				message: 'Save',
				plurality: null
			})).to.be.null;

			expect(messages.normalizeMessage({
				path: 'vendor/project',
				context: 'button',
				message: 'Save',
				plurality: null
			})).to.be.null;
		});
		it("Should reject a message missing a valid path", function () {
			/* jshint expr:true */
			expect(messages.normalizeMessage({context: "button", message: "Save"})).to.be.null;
			expect(messages.normalizeMessage({context: "button", message: "Save", path: "a"})).to.be.null;
			expect(messages.normalizeMessage({context: "button", message: "Save", path: ["a"]})).to.be.null;
			expect(messages.normalizeMessage({context: "button", message: "Save", path: true})).to.be.null;
			expect(messages.normalizeMessage({context: "button", message: "Save", path: {}})).to.be.null;
		});
		it("Should reject a message missing a valid message", function () {
			/* jshint expr:true */
			expect(messages.normalizeMessage({context: "button", path: ['vendor', 'project']})).to.be.null;
			expect(messages.normalizeMessage({context: "button", path: ['vendor', 'project'], message: true})).to.be.null;
		});
		it("Should transform a path expressed as a string", function () {
			messages.normalizeMessage({
				path: 'vendor/project/version',
				context: 'button',
				message: 'Save'
			}).should.deep.equal({
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			});

			messages.normalizeMessage({
				path: 'vendor/project/version',
				context: 'button',
				message: 'Save'
			}).should.deep.equal({
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			});
		});

		it("Should normalize plurality", function () {
			messages.normalizeMessage({
				path: 'vendor/project/version',
				context: 'button',
				message: 'Save'
			}).should.deep.equal({
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			});

			messages.normalizeMessage({
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

			messages.normalizeMessage({
				path: 'vendor/project/version',
				context: 'button',
				message: 'Save',
				plurality: false
			}).should.deep.equal({
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			});

			messages.normalizeMessage({
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

			messages.normalizeMessage({
				path: 'vendor/project/version',
				context: 'button',
				message: 'Save',
				plurality: 0
			}).should.deep.equal({
				path: ['vendor', 'project', 'version'],
				context: 'button',
				message: 'Save',
				plurality: 0
			});

			messages.normalizeMessage({
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

			messages.normalizeMessage({
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

		it("should add just one message", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
				context: 'button',
				message: 'save'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(1);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should replace the messages", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
				context: 'title',
				message: 'hello'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(1);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should be able to re-add the first message", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
				context: 'button',
				message: 'save'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(1);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should add 2 messages", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
				context: 'button',
				message: 'save'
			},{
				path: 'PrestaShop/PrestaShop/1.6.0.9/Back Office',
				context: 'button',
				message: 'cancel'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(2);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should add 1 message to another project without touching the classifications from the existing one", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.11/Back Office',
				context: 'label',
				message: 'hello'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(3);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should add a duplicated message under another project", function (done) {
			localijse.updateMessages([{
				path: 'PrestaShop/PrestaShop/1.6.0.7/Back Office',
				context: 'label',
				message: 'hello'
			}]).then(function () {
				return localijse.find({
					path: 'PrestaShop'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(3);
				done();
			}).fail(function (err) {
				done(err);
			});
		});

		it("should add a message with plurality 2", function (done) {
			localijse.updateMessages([{
				path: 'a/b/c',
				context: 'checkout',
				message: 'You have %d products in your cart.',
				plurality: 2
			}]).then(function () {
				return localijse.find({
					path: 'a'
				});
			}).then(function (paginator) {
				paginator.totalCount.should.equal(1);
				paginator.hits[0].message.should.equal('You have %d products in your cart.');
				paginator.hits[0].message_plurality.should.equal(2);
				done();
			}).fail(function (err) {
				done(err);
			});
		});
	});
});
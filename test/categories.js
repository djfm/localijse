/* global describe, before, it */

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var localijse = require('../app/localijse').init('test');

describe('Categories', function() {

	before(localijse.resetDatabase);

	it('should add 4 elements to the category tree', function(done) {
		localijse.addCategoryPath([
			'PrestaShop Core',
			'1.6.0.9',
			'modules',
			'bankwire'
		]).then(function() {
			return localijse.getCategoryTree();
		}).should.become({
			id: 1,
			lft: 1,
			rgt: 8,
			name: 'PrestaShop Core',
			technical_data: null,
			children: [{
				id: 2,
				lft: 2,
				rgt: 7,
				name: '1.6.0.9',
				technical_data: null,
				children: [{
					id: 3,
					lft: 3,
					rgt: 6,
					name: 'modules',
					technical_data: null,
					children: [{
						id: 4,
						lft: 4,
						rgt: 5,
						name: 'bankwire',
						technical_data: null,
					}]
				}]
			}]
		}).notify(done);
	});

	it('should add a deeply nested item to the category tree', function(done) {
		localijse.addCategoryPath([
			'PrestaShop Core',
			'1.6.0.9',
			'modules',
			'autoupgrade'
		]).then(function() {
			return localijse.getCategoryTree();
		}).should.become({
			id: 1,
			lft: 1,
			rgt: 10,
			name: 'PrestaShop Core',
			technical_data: null,
			children: [{
				id: 2,
				lft: 2,
				rgt: 9,
				name: '1.6.0.9',
				technical_data: null,
				children: [{
					id: 3,
					lft: 3,
					rgt: 8,
					name: 'modules',
					technical_data: null,
					children: [{
						id: 4,
						lft: 4,
						rgt: 5,
						name: 'bankwire',
						technical_data: null,
					},{
						id: 5,
						lft: 6,
						rgt: 7,
						name: 'autoupgrade',
						technical_data: null,
					}]
				}]
			}]
		}).notify(done);
	});
});
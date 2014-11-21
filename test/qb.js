require('chai').should();

var qb = require('../app/lib/qb');

var makeIdForTable = qb.defaultConfig.makeIdForTable;

/* global describe, it */

describe('Query builder', function () {

	describe('makeIdForTable', function () {
		it('should convert CamelCase', function () {
			makeIdForTable('CamelCase').should.equal('camel_case_id');
			makeIdForTable('ACRONYMCamelCase').should.equal('acronym_camel_case_id');
			makeIdForTable('ABCdef').should.equal('ab_cdef_id');
		});
	});

	it('Should build a select without from', function () {
		qb().select('a.x').getQuery().should.equal('SELECT a.x');
		qb().select('a.x', 'b').getQuery().should.equal('SELECT a.x, b');
	});
	it('Should build a select with from', function () {
		qb().select('a.x').from('A').getQuery().should.equal('SELECT a.x FROM A');
		qb().select('a.x').from('A', 'a').getQuery().should.equal('SELECT a.x FROM A a');
		qb().select('a.x').from('A', 'a').from('B', 'b').getQuery().should.equal('SELECT a.x FROM A a, B b');
	});
	it('Should build a select with joins', function () {
		qb()
		.select('a.x')
		.from('A', 'a')
		.joinReferenced('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (b.id = a.b_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.leftJoinReferenced('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a LEFT JOIN B b ON (b.id = a.b_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.rightJoinReferenced('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a RIGHT JOIN B b ON (b.id = a.b_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.joinOwning('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (a.id = b.a_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.leftJoinOwning('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a LEFT JOIN B b ON (a.id = b.a_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.rightJoinOwning('B b', 'a')
		.getQuery().should.equal('SELECT a.x FROM A a RIGHT JOIN B b ON (a.id = b.a_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.joinOwning('B b', 'a.z')
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (a.z = b.a_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.joinReferenced('B b', 'a.b_id')
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (b.id = a.b_id)');

		qb()
		.select('a.x')
		.from('A', 'a')
		.joinReferenced('B b', 'a.b_id', 'x.y')
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (x.y = a.b_id)');

		var parts = [
			'SELECT cm.id, m.message',
			'FROM ContextualizedMessage cm',
			'INNER JOIN Message m ON (m.id = cm.message_id)',
			'INNER JOIN Classification c ON (c.contextualized_message_id = cm.id)',
			'INNER JOIN Category cat ON (cat.id = c.category_id)',
			'WHERE (cat.lft BETWEEN ? AND ?)',
			'GROUP BY cm.id'
		];

		qb()
		.select('cm.id', 'm.message')
		.from('ContextualizedMessage', 'cm')
		.joinReferenced('Message m', 'cm')
		.joinReferenced('Classification c', 'cm.id', 'c.contextualized_message_id')
		.joinReferenced('Category cat', 'c')
		.where('BETWEEN', 'cat.lft', '?', '?')
		.groupBy('cm.id')
		.getQuery()
		.should.equal(parts.join(' '));
	});

	it("Should build conditions", function () {
		
		qb.condition('=', 'a', 'b').toString().should.equal('(a = b)');
		qb.condition('BETWEEN', 'a', '1', '2').toString().should.equal('(a BETWEEN 1 AND 2)');
		qb.condition('IS NULL', 'a').toString().should.equal('(a IS NULL)');
		qb.condition('IS NOT NULL', 'a').toString().should.equal('(a IS NOT NULL)');
		qb.condition('true').toString().should.equal('true');
		
		qb.condition('and', function (and) {
			and('<', 'x', '1');
			and('>', 'y', '2');
		}).toString().should.equal('((x < 1) AND (y > 2))');

		qb.condition('and', function (and) {
			and('<', 'x', '1');
			and('or', function (or) {
				or('>', 'y', '2');
				or('<', 'z', '3');
			});
		}).toString().should.equal('((x < 1) AND ((y > 2) OR (z < 3)))');
	});

	it('Should make a join with advanced conditions', function () {
		qb()
		.select('a.x')
		.from('A', 'a')
		.joinReferenced('B b', 'a', function (cond) {
			cond('=', 'b.z', 4);
		})
		.getQuery().should.equal('SELECT a.x FROM A a INNER JOIN B b ON (b.id = a.b_id) AND (b.z = 4)');
	});

	it("Should generate where clauses", function () {
		qb().select('a').from('A').where('=', 'b', '?')
		.getQuery().should.equal("SELECT a FROM A WHERE (b = ?)");

		qb().select('a').from('A').where('or', function(or) {
			or('BETWEEN', 'a', 'b', 'c');
			or('and', function (and) {
				and('<', 'x', 4);
				and('>', 'z', 2);
			});
		})
		.getQuery().should.equal("SELECT a FROM A WHERE ((a BETWEEN b AND c) OR ((x < 4) AND (z > 2)))");
	});
});
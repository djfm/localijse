require('chai').should();

var qb = require('../app/lib/qb');

/* global describe, it */
/*
var sql = '\
	SELECT cm.id, m.message \
	FROM ContextualizedMessage cm \
	INNER JOIN Message m ON m.id = cm.message_id \
	INNER JOIN Classification c ON c.contextualized_message_id = cm.id \
	INNER JOIN Category cat ON cat.id = c.category_id \
	WHERE cat.lft BETWEEN ? and ? \
	GROUP BY cm.id \
';*/


describe.only('Query builder', function () {

	describe('makeIdForTable', function () {
		it ('should convert CamelCase', function () {
			qb().makeIdForTable('CamelCase').should.equal('camel_case_id');
			qb().makeIdForTable('ACRONYMCamelCase').should.equal('acronym_camel_case_id');
			qb().makeIdForTable('ABCdef').should.equal('ab_cdef_id');
		});
	});

	it ('Should build a select without from', function () {
		qb().select('a.x').getQuery().should.equal('SELECT a.x');
		qb().select('a.x', 'b').getQuery().should.equal('SELECT a.x, b');
	});
	it ('Should build a select with from', function () {
		qb().select('a.x').from('A').getQuery().should.equal('SELECT a.x FROM A');
		qb().select('a.x').from('A', 'a').getQuery().should.equal('SELECT a.x FROM A a');
		qb().select('a.x').from('A', 'a').from('B', 'b').getQuery().should.equal('SELECT a.x FROM A a, B b');
	});
	it ('Should build a select with joins', function () {
		qb()
		.select('a.x')
		.from('A')
		.join('B b', 'A')
		.getQuery().should.equal('SELECT a.x FROM A INNER JOIN B b ON b.id = A.b_id');

		qb()
		.select('a.x')
		.from('A')
		.join('B b', 'A.b_id')
		.getQuery().should.equal('SELECT a.x FROM A INNER JOIN B b ON b.id = A.b_id');

		qb()
		.select('a.x')
		.from('A')
		.join('B b', 'A.b_id', 'x.y')
		.getQuery().should.equal('SELECT a.x FROM A INNER JOIN B b ON x.y = A.b_id');

		var parts = [
			'SELECT cm.id, m.message',
			'FROM ContextualizedMessage cm',
			'INNER JOIN Message m ON m.id = cm.message_id',
			'INNER JOIN Classification c ON c.contextualized_message_id = cm.id',
			'INNER JOIN Category cat ON cat.id = c.category_id',
		];

		var query = qb()
		.select('cm.id', 'm.message')
		.from('ContextualizedMessage', 'cm')
		.join('Message m', 'cm')
		.join('Classification c', 'cm.id', 'c.contextualized_message_id')
		.join('Category cat', 'c')
		.getQuery()
		.should.equal(parts.join(' '));

		parts = parts.concat([
			'WHERE cat.lft BETWEEN ? and ? ',
			'GROUP BY cm.id'
		]);
	});
});
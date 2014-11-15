var _ = require('underscore');

function qb() {

	var type = null;
	var select = [], from = [], joins = [], where = [], groupBy = [];
	var aliases = {};

	function saveAlias (tableMaybeAliased, alias) {
		var table = tableMaybeAliased;

		if (!alias) {
			var parts = tableMaybeAliased.trim().split(/\s+/);

			if (parts.length === 1) {
				table = alias = parts[0];
			} else {
				table = parts[0];
				alias = parts[1];
			}
		}
		
		if (aliases.hasOwnProperty(alias)) {
			throw new Error('This table alias was already defined: `' + alias + '`');
		} else {
			aliases[alias] = table;
		}

		return alias;
	}

	function getTable(alias) {
		if (aliases.hasOwnProperty(alias)) {
			return aliases[alias];
		} else {
			throw new Error('There is no table with alias `' + alias + '`');
		}
	}

	function buildSelect() {
		var sql = 'SELECT ' + select.join(', ');

		if (from.length > 0) {
			sql = sql + ' FROM ' + from.join(', ');
		}

		if (joins.length > 0) {
			sql = sql + ' ' + joins.join(' ');
		}

		function w(clause) {
			return clause.toString();
		}

		if (where.length > 0) {
			sql = sql + ' WHERE ' + _.map(where, w).join(' AND ');
		}

		if (groupBy.length > 0) {
			sql = sql + ' GROUP BY ' + groupBy.join(', ');
		}

		return sql;
	}

	return {
		select: function () {

			type = type || 'select';

			select = select.concat(_.toArray(arguments));

			return this;
		},
		from: function (table, alias) {

			if (alias) {
				table = table + ' ' + alias;
				saveAlias(table, alias);
			}

			from.push(table);

			return this;
		},
		join: function (tableWithMaybeAlias, joinTarget, joinSource) {

			var sourceAlias = saveAlias(tableWithMaybeAlias);
			var sourceTable = getTable(sourceAlias);

			if (!joinSource) {
				joinSource = sourceAlias + '.id';
			}

			if (!/\w+\.\w+/.exec(joinTarget)) {
				joinTarget = joinTarget + '.' + this.makeIdForTable(sourceTable);
			}

			var join = 'INNER JOIN ' + tableWithMaybeAlias + ' ON ' + joinSource + ' = ' + joinTarget;
			
			joins.push(join);

			return this;
		},
		where: function () {
			where.push(condition.apply(undefined, arguments));
			return this;
		},
		groupBy: function () {
			groupBy = groupBy.concat(_.toArray(arguments));
			return this;
		},
		getQuery: function () {
			if (type === 'select') {
				return buildSelect.apply(undefined, arguments);
			}
		},
		toString: function () {
			return this.getQuery();
		},
		makeIdForTable: function (tableName) {
			//CustomizedMessage
			return tableName.replace(/([a-z]|[A-Z]+)([A-Z])/g, function (m, a, b) {
				return a + '_' + b;
			}).toLowerCase()+'_id';
		}
	};
}

function condition () {
	var type, nested, assertion, children = [];


	function buildAssertion(assertion) {

		if (assertion.length === 1) {
			return assertion[0];
		}

		var defaults = {left: 1, right: 1};
		var ops 	 = {
			'BETWEEN': {left: 1, right: 2, joinRight: ' AND '}
		};
		var op = assertion[0];
		var settings = ops[op] || defaults;

		settings.joinLeft 	= settings.joinLeft 	|| ' ';
		settings.joinRight 	= settings.joinRight 	|| ' ';

		var left 	= assertion.slice(1, 1 + settings.left).join(settings.joinLeft);
		var right 	= assertion.slice(1 + settings.left, 1 + settings.left + settings.right).join(settings.joinRight);

		return '(' + [left, op, right].join(' ') + ')';
	}

	if (Object.prototype.toString.call(arguments[1]) === '[object Function]') {
		type = arguments[0];
		nested = arguments[1];

		nested(function() {
			children.push(condition.apply(undefined, arguments));
		});

	} else {
		assertion = _.toArray(arguments);
	}

	function toString () {
		if (!nested) {
			return buildAssertion(assertion);
		} else {
			var nestedStrings = _.map(children, function (child) {
				return child.toString();
			});
			if (type === 'and') {
				return '(' + nestedStrings.join(' AND ') + ')';
			} else if (type === 'or') {
				return '(' + nestedStrings.join(' OR ') + ')';
			} else {
				throw new Error('Invalid nesting type, should be `and` or `or`, got `' + type + '`.');
			}
		}

		return "NIY";
	}

	return {
		toString: toString
	};
}

qb.condition = condition;

module.exports = qb;
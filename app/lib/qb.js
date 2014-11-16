var _ = require('underscore');

function makeIdForTable (tableName) {
	//CustomizedMessage
	return tableName.replace(/([a-z]|[A-Z]+)([A-Z])/g, function (m, a, b) {
		return a + '_' + b;
	}).toLowerCase()+'_id';
}

function qb () {

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

	function getTable (alias) {
		if (aliases.hasOwnProperty(alias)) {
			return aliases[alias];
		} else {
			throw new Error('There is no table with alias `' + alias + '`');
		}
	}

	function buildSelect () {
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

	function join (joinWhich, owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause) {

		if (!referencedClause) {
			referencedClause = referencedAlias + '.id';
		}

		if (!owningClause) {
			owningClause = owningAlias + '.' + qb.makeIdForTable(referencedTable);
		}

		var table;

		if (joinWhich === 'referenced') {
			table = referencedTable;
			if (referencedAlias !== referencedTable) {
				table += ' ' + referencedAlias;
			}
		} else {
			table = owningTable;
			if (owningAlias !== owningTable) {
				table += ' ' + owningAlias;
			}
		}

		joins.push('INNER JOIN ' + table + ' ON ' + referencedClause + ' = ' + owningClause);
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
			} else {
				saveAlias(table, table);
			}

			from.push(table);

			return this;
		},
		/**
		 * Joins a table, with aliasOrField being interpreted as the owning side, i.e.:
		 * join('B b', 'A') => INNER JOIN B b ON b.id = A.b_id
		 */
		join: function (tableIntroduced, aliasOrField, maybeField) {

			var referencedAlias = saveAlias(tableIntroduced);
			var referencedTable = getTable(referencedAlias);

			var owningTable, owningAlias;
			var owningClause, referencedClause;

			var m = /^(\w+)\.(\w+)$/.exec(aliasOrField.trim());
			if (m) {
				owningAlias 	= m[1];
				owningTable 	= getTable(owningAlias);
				owningClause 	= aliasOrField;
			} else {
				owningAlias = aliasOrField;
				owningTable = getTable(owningAlias);
			}

			if (maybeField) {
				joins.push('INNER JOIN ' + tableIntroduced + ' ON ' + maybeField + ' = ' + aliasOrField);
			} else {
				join('referenced', owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause);
			}

			return this;
		},
		/**
		 * Joins a table, with tableIntroduced being interpreted as the owning side, i.e.:
		 * joined('B b', 'A') => INNER JOIN B b ON a.id = B.a_id
		 */
		joined: function (tableIntroduced, aliasOrField, maybeField) {
			var owningAlias = saveAlias(tableIntroduced);
			var owningTable = getTable(owningAlias);

			var referencedTable, referencedAlias;
			var owningClause, referencedClause;

			var m = /^(\w+)\.(\w+)$/.exec(aliasOrField.trim());
			if (m) {
				referencedAlias 	= m[1];
				referencedTable 	= getTable(referencedAlias);
				referencedClause 	= aliasOrField;
			} else {
				referencedAlias = aliasOrField;
				referencedTable = getTable(referencedAlias);
			}

			if (maybeField) {
				joins.push('INNER JOIN ' + tableIntroduced + ' ON ' + maybeField + ' = ' + aliasOrField);
			} else {
				join('owning', owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause);
			}

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
qb.makeIdForTable = makeIdForTable;

module.exports = qb;
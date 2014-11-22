var _ = require('underscore');

function condition () {
	var type, nested, assertion, children = [];


	function buildAssertion(assertion) {

		if (assertion.length === 1) {
			return assertion[0];
		}

		var defaults = {left: 1, right: 1};
		var ops 	 = {
			'BETWEEN': {left: 1, right: 2, joinRight: ' AND '},
			'IS NULL': {left: 1, right: 0},
			'IS NOT NULL': {left: 1, right: 0}
		};
		var op = assertion[0];
		var settings = ops[op] || defaults;

		settings.joinLeft 	= settings.joinLeft 	|| ' ';
		settings.joinRight 	= settings.joinRight 	|| ' ';

		var left 	= assertion.slice(1, 1 + settings.left).join(settings.joinLeft);
		var right 	= assertion.slice(1 + settings.left, 1 + settings.left + settings.right).join(settings.joinRight);

		var parts = [op];
		if (left) {
			parts.unshift(left);
		}
		if (right) {
			parts.push(right);
		}

		return '(' + parts.join(' ') + ')';
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
	}

	return {
		toString: toString
	};
}

function qb (config) {

	config = _.defaults((config || {}), qb.defaultConfig);

	var type = null;
	var select = [], from = [], joins = [], where = [], groupBy = [], orderBy = [];
	var limit, offset;
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

		if (orderBy.length > 0) {
			sql = sql + ' ORDER BY ' + orderBy.join(', ');
		}

		if (limit) {
			sql = sql + ' LIMIT ' + limit;
			if (offset) {
				sql = sql + ' OFFSET ' + offset;
			}
		}

		return sql;
	}

	function addJoin () {
		var args = _.toArray(arguments);

		var type = args[0];
		var table = args[1];
		var conditions = args.slice(2).reduce(function (soFar, c) {
			if (c) {
				soFar.push(c.toString());
			}
			return soFar;
		}, []);

		conditions = _.map(conditions, function (c) {
			return c.toString();
		});
		joins.push([type, table, 'ON'].concat(conditions.join(' AND ')).join(' '));
	}

	function join (joinType, joinWhich, owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause, cond) {

		if (!referencedClause) {
			referencedClause = referencedAlias + '.id';
		}
		
		if (!owningClause) {
			owningClause = owningAlias + '.' + config.makeIdForTable(referencedTable);
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

		joinType = joinType || 'INNER JOIN';

		addJoin(joinType, table, condition('=', referencedClause, owningClause), cond);
	}

	function joinReferenced (joinType, tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
		
		var field, cond;
		if (fieldOrConditionBuilder) {
			if (Object.prototype.toString.call(fieldOrConditionBuilder) === '[object Function]') {
				cond = fieldOrConditionBuilder;
			} else {
				field = fieldOrConditionBuilder;
				if (Object.prototype.toString.call(maybeConditionBuilder) === '[object Function]') {
					cond = maybeConditionBuilder;
				}
			}
		}

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

		if (cond) {
			cond(function () {
				cond = condition.apply(undefined, arguments);
			});
		}

		if (field) {
			addJoin(joinType, tableIntroduced, condition('=', field, aliasOrField), cond);
		} else {
			join(joinType, 'referenced', owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause, cond);
		}
	}

	function joinOwning (joinType, tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
		
		var field, cond;
		if (fieldOrConditionBuilder) {
			if (Object.prototype.toString.call(fieldOrConditionBuilder) === '[object Function]') {
				cond = fieldOrConditionBuilder;
			} else {
				field = fieldOrConditionBuilder;
				if (Object.prototype.toString.call(maybeConditionBuilder) === '[object Function]') {
					cond = maybeConditionBuilder;
				}
			}
		}

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

		if (cond) {
			cond(function () {
				cond = condition.apply(undefined, arguments);
			});
		}

		if (field) {
			addJoin(joinType, tableIntroduced, condition('=', field, aliasOrField), cond);
		} else {
			join(joinType, 'owning', owningTable, owningAlias, referencedTable, referencedAlias, owningClause, referencedClause, cond);
		}
	}

	var queryBuilder =  {
		select: function () {

			type = type || 'select';

			select = select.concat(_.toArray(arguments));

			return this;
		},
		clearSelect: function () {
			select = [];

			this.select.apply(this, arguments);

			return this;
		},
		from: function (table, alias) {

			if (alias) {
				saveAlias(table, alias);
				table = table + ' ' + alias;
			} else {
				saveAlias(table, table);
			}

			from.push(table);

			return this;
		},
		/**
		 * Joins a table, with tableIntroduced being interpreted as the referenced side, i.e.:
		 * join('B b', 'A') => INNER JOIN B b ON b.id = A.b_id
		 */
		joinReferenced: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinReferenced('INNER JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
			return this;
		},
		leftJoinReferenced: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinReferenced('LEFT JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
			return this;
		},
		rightJoinReferenced: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinReferenced('RIGHT JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
			return this;
		},

		/**
		 * Joins a table, with tableIntroduced being interpreted as the owning side, i.e.:
		 * joined('B b', 'A') => INNER JOIN B b ON a.id = B.a_id
		 */
		joinOwning: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinOwning('INNER JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
			return this;
		},
		leftJoinOwning: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinOwning('LEFT JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
			return this;
		},
		rightJoinOwning: function (tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder) {
			joinOwning('RIGHT JOIN', tableIntroduced, aliasOrField, fieldOrConditionBuilder, maybeConditionBuilder);
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
		orderBy: function () {
			orderBy = orderBy.concat(_.toArray(arguments));
			return this;
		},
		getQuery: function () {
			if (type === 'select') {
				return buildSelect.apply(undefined, arguments);
			}
		},
		limit: function (number) {
			limit = number;
			return this;
		},
		offset: function (number) {
			offset = number;
			return this;
		},
		toString: function () {
			return this.getQuery();
		}
	};

	queryBuilder.join = queryBuilder.joinReferenced;
	queryBuilder.leftJoin = queryBuilder.leftJoinReferenced;
	queryBuilder.rightJoin = queryBuilder.rightJoinReferenced;

	return queryBuilder;
}

qb.condition = condition;

qb.defaultConfig = {
	makeIdForTable: function (tableName) {
		return tableName.replace(/([a-z]|[A-Z]+)([A-Z])/g, function (m, a, b) {
			return a + '_' + b;
		}).toLowerCase()+'_id';
	}
};

module.exports = qb;
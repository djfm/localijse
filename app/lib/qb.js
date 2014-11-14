var _ = require('underscore');

module.exports = function () {

	var type = null;

	var select = [], from = [], joins = [];

	var aliases = {};

	function saveAlias (tableMaybeAliased) {
		var parts = tableMaybeAliased.trim().split(/\s+/);
		var table, alias;

		if (parts.length === 1) {
			table = alias = parts[0];
		} else {
			table = parts[0];
			alias = parts[1];
		}

		aliases[alias] = table;

		return alias;
	}

	function buildSelect() {
		var sql = 'SELECT ' + select.join(', ');

		if (from.length > 0) {
			sql = sql + ' FROM ' + from.join(', ');
		}

		if (joins.length > 0) {
			sql = sql + ' ' + joins.join(' ');
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
				aliases[alias] = table;
			}

			from.push(table);

			return this;
		},
		join: function (tableWithMaybeAlias, joinTarget, joinSource) {

			var sourceAlias = saveAlias(tableWithMaybeAlias);
			var sourceTable = aliases[sourceAlias];

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
		getQuery: function () {
			if (type === 'select') {
				return buildSelect.apply(null, arguments);
			}
		},
		makeIdForTable: function (tableName) {
			//CustomizedMessage
			return tableName.replace(/([a-z]|[A-Z]+)([A-Z])/g, function (m, a, b) {
				return a + '_' + b;
			}).toLowerCase()+'_id';
		}
	};
};
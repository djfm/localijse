var _ = require('underscore');
var q = require('q');

/**
 * Wrap native query inside a promise.
 */
function query (connection, sql, params) {
	var d = q.defer();

	if (typeof sql !== 'string') {
		sql = sql.toString();
	}

	connection.query(sql, params, function (err, res) {
		if (err) {
			d.reject(err);
		} else {
			d.resolve(res);
		}
	});

	return d.promise;
}

/**
 * "save" an object:
 * - if the object has an id, it is updated,
 * - if not, it is inserted
 *
 * If columns (an array of columns) is specified,
 * only the corresponding properties of the object
 * are taken into account.
 */
function save (connection, tableName, object, columns) {
	if (Object.prototype.toString.call(columns) !== '[object Array]') {
		columns = _.without(_.keys(object), 'id');
	}

	columns = _.filter(columns, function (col) {
		return object.hasOwnProperty(col);
	});

	var sql;

	if (object.id) {
		sql = 'UPDATE ?? SET ? WHERE id = ?';
		return query(connection, sql, [tableName, _.pick(object, columns), object.id]);
	} else {

		sql = 'INSERT INTO ?? ' + toColumnPlaceHolders(columns) + ' VALUES ' + toValuePlaceHolders(columns);
		
		return query(connection, sql, [tableName].concat(columns).concat(toValues(columns, object)));
	}
}

/**
 * Insert Ignore, returns id of inserted row or pre-existing row.
 */
function insertIgnore(connection, tableName, object) {
	var columns = _.keys(object);
	var insertSQL = 'INSERT IGNORE INTO ?? ' + toColumnPlaceHolders(columns) + ' VALUES ' + toValuePlaceHolders(columns);
	return query(connection, insertSQL, [tableName].concat(columns).concat(toValues(columns, object)))
	.then(function (res) {
		if (res.insertId > 0) {
			return q(res.insertId);
		} else {
			var selectSQL = 'SELECT id FROM ?? WHERE ' + toEqPlaceHolders(columns);
			return query(
				connection,
				selectSQL,
				[tableName].concat(toColumnsAndValues(columns, object))
			).then(function (rows) {
				return rows[0].id;
			});
		}
	});
}

function upsert (connection, tableName, keyFields, valueFields) {
	var keyColumns = _.keys(keyFields);
	var valueColumns = _.keys(valueFields);
	var allColumns = keyColumns.concat(valueColumns);
	var allValues = _.values(keyFields).concat(_.values(valueFields));

	var sql = "INSERT INTO ?? " + toColumnPlaceHolders(allColumns) + " VALUES " + toValuePlaceHolders(allValues);
	sql = sql + " ON DUPLICATE KEY UPDATE " + toEqPlaceHolders(valueColumns);

	var params = [tableName].concat(allColumns).concat(allValues).concat(toColumnsAndValues(valueColumns, valueFields));

	return query(connection, sql, params).then(function (res) {
		if (res.insertId > 0) {
			return q(res.insertId);
		} else {
			return query(connection, 'SELECT id FROM ?? WHERE ?', [tableName, keyFields]).get(0).get('id');
		}
	});
}

function toValues(columns, object) {
	return _.map(columns, function (name) { return object[name]; });
}

function toColumnsAndValues(columns, object) {
	var arr = [];

	_.each(columns, function (name) {
		arr.push(name);
		arr.push(object[name]);
	});

	return arr;
}

function toPlaceHolders(columns, placeHolder) {
	return '(' + _.map(columns, function () { return placeHolder; }).join(', ') + ')';
}

function toColumnPlaceHolders(columns) {
	return toPlaceHolders(columns, '??');
}

function toValuePlaceHolders(columns) {
	return toPlaceHolders(columns, '?');
}

function toEqPlaceHolders(columns) {
	return _.map(columns, function () {
		return '?? = ?';
	}).join(' AND ');
}

exports.save = save;
exports.query = query;
exports.insertIgnore = insertIgnore;
exports.upsert = upsert;
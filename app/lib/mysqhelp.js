var _ = require('underscore');
var q = require('q');

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

	var query, d = q.defer();

	if (object.id) {
		query = 'UPDATE ?? SET ? WHERE id = ?';
		connection.query(query, [tableName, _.pick(object, columns), object.id], function (err, results) {
			if (err) {
				d.reject(err);
			} else {
				d.resolve(results);
			}
		});
	} else {
		var columnPlaceHolders 	= _.map(columns, function () { return '??'; }).join(', ');
		var valuePlaceHolders 	= _.map(columns, function () { return '?'; }).join(', ');
		var values       		= _.map(columns, function (name) { return object[name]; });

		query = 'INSERT INTO ?? (' + columnPlaceHolders + ') VALUES (' + valuePlaceHolders + ')';
		
		connection.query(
			query,
			[tableName].concat(columns).concat(values),
			function (err, results) {
				if (err) {
					d.reject(err);
				} else {
					d.resolve(results);
				}
			}
		);
	}

	return d.promise;
}

exports.save = save;
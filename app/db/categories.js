var q = require('q');

/**
 * Adds a path to the category tree.
 *
 * Connection is the mysql connection.
 * 
 * Path is an array of strings or strings with payloads:
 * [a, b, c, {name: d, technical_data: "some_string"}]
 *
 * Returns array of category ids
 * 
 */
function addPath (connection, path) {
	var d = q.defer();

	getTree(connection)
	.fail(d.reject)
	.then(function (tree) {
		if (!tree) {
			tree = {};
		}
	});

	d.resolve(true);

	return d.promise;
}

/* jshint maxdepth:4 */

function rebuildTreeFromSortedRows(rows)
{
	var stack = [];
	for (var r = 0, l = rows.length; r < l; ++r) {
		
		var row = rows[r];
		
		if (r > 0 && row.lft + 1 === stack[0].lft) {
			for (var n = 0, stackLen = stack.length; n < stackLen; ++n) {
				var rgt = stack[n].rgt;
				if (rgt + 1 === row.rgt) {
					row.children = stack.splice(0, n + 1);
					break;
				}
			}
		}

		stack.unshift(row);
	}

	return stack[0];
}

function getTree (connection) {
	var d = q.defer();

	d.resolve(true);
	connection.query('SELECT * FROM Category ORDER BY lft DESC', function (err, rows) {
		if (err) {
			d.reject(err);
		} else {
			var tree = rebuildTreeFromSortedRows(rows);
			d.resolve(tree);
		}
	});

	return d.promise;
}

exports.getTree = getTree;
exports.addPath = addPath;
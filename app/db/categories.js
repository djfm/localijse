var q = require('q');
var _ = require('underscore');

function addToTree(tree, path)
{
	var item = path.shift();
	if (!item) {
		return tree;
	}

	if (typeof item === 'string') {
		item = {
			'name': item
		};
	}

	if (!tree) {
		return addToTree(item, path);
	} else {
		_.each(tree.children, function(child) {
			if (child.name === item.name) {
				if (item.hasOwnProperty('technical_data')) {
					child.technical_data = item.technical_data;
				}
				return addToTree(child, path);
			}
		});

		if (!tree.children) {
			tree.children = [];
		}

		tree.children.push(addToTree(item, path));
		return tree;
	}
}

function numberTree (tree, pos) {
	
	if (pos === undefined) {
		pos = 1;
	}

	tree.lft = pos;

	if (!tree.children || tree.children.length === 0) {
		tree.rgt = ++pos;
		return ++pos;
	}

	_.each(tree.children, function (child) {
		pos = numberTree(child, ++pos);
	});

	tree.rgt = pos;

	return ++pos;
}

function flattenTree (tree) {
	var objects = [];
	if (!tree) {
		return objects;
	}

	objects.push(_.omit(tree, 'children'));
	_.each(tree.children, function (child) {
		objects = objects.concat(flattenTree(child));
	});

	return objects;
}

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
		tree = addToTree(tree, path.slice(0));
		numberTree(tree);
		var rows = flattenTree(tree);
		
		q
		.ninvoke(connection, 'query', 'LOCK TABLES Category WRITE')
		.done(function (err, result) {
			console.log("hi");
			q.ninvoke(connection, 'query', 'UNLOCK TABLES').done(function() {
				if (err) {
					d.reject(err);
				} else {
					d.resolve();
				}
			});
		});
		//.done(q.nbind(connection.query, 'UNLOCK TABLES'));

		/*q
		.nfcall(connection.query, 'LOCK TABLE Category WRITE')
		.then(function() {

		});*/
	});

	return d.promise;
}

function rebuildTreeFromSortedRows(rows)
{
	/* jshint maxdepth:4 */

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
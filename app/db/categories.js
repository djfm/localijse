var q = require('q');
var _ = require('underscore');

var mysqhelp   = require('../lib/mysqhelp');
var treeHelper = require('../lib/tree-helper');

function storeRow(connection, row) {
	return mysqhelp.save(connection, 'Category', row, ['name', 'lft', 'rgt', 'technical_data']);
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
function addCategoryPath (connection, path) {
	return addCategoryTree(connection, treeHelper.makeTreeFromPath(path));
}

function addCategoryTree(connection, treeToAdd) {
	return getCategoryTree(connection)
	.then(function (tree) {
		tree = treeHelper.mergeTrees(tree, treeToAdd);
		tree = treeHelper.number(tree);

		var rows = treeHelper.flatten(tree);
		
		return q
		.ninvoke(connection, 'query', 'LOCK TABLES Category WRITE')
		.then(function() {
			return q.all(_.map(rows, storeRow.bind(null, connection)));
		})
		.fin(q.nbind(connection.query, connection, 'UNLOCK TABLES'));
	});
}

function getCategoryTree (connection) {
	var d = q.defer();

	connection.query('SELECT * FROM Category ORDER BY lft DESC', function (err, rows) {
		if (err) {
			d.reject(err);
		} else {
			var tree = treeHelper.unFlattenNumberedTree(rows);
			d.resolve(tree);
		}
	});

	return d.promise;
}

exports.getCategoryTree = getCategoryTree;
exports.addCategoryPath = addCategoryPath;
exports.addCategoryTree = addCategoryTree;
var q 			= require('q');
var _ 			= require('underscore');

var categories  = require('../db/categories');
var treeHelper 	= require('../lib/tree-helper');

function findMessages (connection, query) {
	if (!query.path) {
		return q.reject(new Error('No path specified.'));
	}

	if (typeof query.path === 'string') {
		query.path = _.filter(query.path.split('/'), function (elem) { return elem !== ''; });
	}

	if (query.path.length < 1) {
		return q.reject(new Error('Need to specifcy at least the vendor in the path.'));
	}

	return categories.getCategoryTree(connection)
	.then(function (tree) {
		return q(treeHelper.getNodeAtPath(tree, query.path));
	})
	// get the messages
	.then(function (rootCategory) {
		/* jshint multistr:true */
		var sql = '\
			SELECT cm.id \
			FROM ContextualizedMessage cm \
			INNER JOIN Message m ON m.id = cm.message_id \
			INNER JOIN Classification c ON c.contextualized_message_id = cm.id \
			INNER JOIN Category cat ON cat.id = c.category_id \
			WHERE cat.lft BETWEEN ? and ? \
			GROUP BY cm.id \
		';
		return q.ninvoke(connection, 'query', sql, [rootCategory.lft, rootCategory.rgt]);
	})
	// wrap the results
	.then(function (data) {
		var rows = data[0];
		var paginator = {
			totalCount: rows.length,
			retrievedCount: rows.length,
			hits: _.map(rows, formatRowForOutput)
		};

		return q(paginator);
	});

	function formatRowForOutput(row) {
		return row;
	}
}

exports.findMessages = findMessages;
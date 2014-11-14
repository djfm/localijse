var q 			= require('q');
var _ 			= require('underscore');

var categories  = require('../db/categories');
var treeHelper 	= require('../lib/tree-helper');

/**
 * find Messages, with or without translations.
 * `query` is an object with the following keys:
 * 	- path: string, "/" separated list of path components, or array of strings
 * 			this determines where the function will search
 * 	- message: textCondition (see below)
 * 	- context: textCondition (see below)
 * 	- hasTranslation: true or false - anything else is error
 * 	- translation: textCondition (see below)
 * 	- locale: string, a language locale
 * 	- status: a valid MappingStatus string
 *
 *  In this context, a `textCondition` is either a string,
 *  which will be interpreted as an "=" condition,
 *  an object with a 'like' key, the value of which is used in a "LIKE" clause,
 *  or any falsey value, which means to disable the condition.
 */

function findMessages (connection, query) {
	
	/**
	 * Normalize query.path
	 */

	if (!query.path) {
		return q.reject(new Error('No path specified.'));
	}

	if (typeof query.path === 'string') {
		query.path = _.filter(query.path.split('/'), function (elem) { return elem !== ''; });
	}

	if (query.path.length < 1) {
		return q.reject(new Error('Need to specify at least the vendor part of the path.'));
	}



	return categories.getCategoryTree(connection)
	.then(function (tree) {
		return q(
			treeHelper.getNodeAtPath(tree, query.path));
	})
	// get the messages
	.then(function (rootCategory) {
		/* jshint multistr:true */
		var sql = '\
			SELECT cm.id, m.message \
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
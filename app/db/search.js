var q 			= require('q');
var _ 			= require('underscore');

var categories  = require('../db/categories');
var languages 	= require('../db/languages');
var mysqhelp  	= require('../lib/mysqhelp');
var qb  		= require('../lib/qb');
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

function find (connection, query) {
	
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

	query.hitsPerPage = +(query.hitsPerPage || 0);
	query.page = +(query.page || 0);

	if (isNaN(query.hitsPerPage) || query.hitsPerPage < 1 || query.hitsPerPage > 25) {
		query.hitsPerPage = 25;
	}

	if (isNaN(query.page) || query.page < 1) {
		query.page = 1;
	}

	var rootCategory;

	function buildQuery (forCount) {

		var forReal = !forCount;

		var sql = qb()
		.from('ContextualizedMessage', 'cm')
		.joinReferenced('Message m', 'cm')
		.joinOwning('Classification c', 'cm')
		.joinReferenced('Category cat', 'c')
		.where('BETWEEN', 'cat.lft', '?', '?')
		.groupBy('cm.id');

		var params = [rootCategory.lft, rootCategory.rgt];

		if (query.hasOwnProperty('hasTranslation')) {
			if (query.hasTranslation) {
				sql.joinOwning('Mapping map', 'cm');
				sql.joinReferenced('MappingVersion v', 'map');
				sql.joinReferenced('Translation t', 'v');
				sql.joinReferenced('Language l', 't');

				sql.where('=', 'l.locale', '?');
				params.push(languages.normalizeLocale(query.locale));

				if (forReal) {
					sql.joinReferenced('MappingStatus st', 'v');
					sql.joinReferenced('User uc', 'v.created_by');
					sql.joinReferenced('User ur', 'v.reviewed_by');
					sql.select('st.name as status');
					sql.select('map.plurality as translation_plurality');
					sql.select('t.translation');
					sql.select('uc.username as created_by', 'ur.username as reviewed_by');
					sql.select('v.created_at');
					sql.select('l.locale', 'l.name as language');
					sql.groupBy('map.id');
				}
			}
		}

		if (forCount) {
			sql.select('COUNT (cm.id) as totalCount');
		} else {
			sql.select('cm.id as contextualized_message_id', 'cm.plurality as message_plurality');
			sql.limit(query.hitsPerPage).offset((query.page - 1) * query.hitsPerPage);
		}

		if (query.message) {
			if (typeof query.message === 'string') {
				sql.where('=', 'm.message', '?');
				params.push(query.message);
			}
		}

		return {
			sql: sql,
			params: params
		};
	}

	return categories.getCategoryTree(connection)
	.then(function (tree) {
		return q(
			treeHelper.getNodeAtPath(tree, query.path));
	})
	// Count the results
	.then(function (cat) {
		rootCategory = cat;
		var forCount = true;
		var sql = buildQuery(forCount);
		return mysqhelp.query(connection, sql.sql, sql.params).then(function (rows) {
			if (rows && rows.length === 0) {
				return 0;
			} else {
				return rows[0].totalCount;
			}
		});
	})
	// Get the paginated results
	.then(function (totalCount) {
		var forCount = true;
		var sql = buildQuery(!forCount);

		if (totalCount === 0) {
			return q({
				page: 0,
				pageCount: 0,
				totalCount: 0,
				retrievedCount: 0,
				hits: []
			});
		}

		return mysqhelp.query(connection, sql.sql, sql.params).then(function (rows) {
			var hits = buildHits(rows);
			var retrievedCount = hits.length;
			var pageCount = Math.ceil(totalCount / query.hitsPerPage);
			var page = query.page;

			var paginator = {
				page: page,
				pageCount: pageCount,
				totalCount: totalCount,
				retrievedCount: retrievedCount,
				hits: hits
			};

			return q(paginator);
		});
	});

	function buildHits(rows) {
		return _.map(rows, formatRowForOutput);
	}

	function formatRowForOutput(row) {
		return row;
	}
}

exports.find = find;
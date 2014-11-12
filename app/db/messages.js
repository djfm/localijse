var q 			= require('q');
var _ 			= require('underscore');

var categories  = require('../db/categories');
var treeHelper 	= require('../lib/tree-helper');
var mysqhelp 	= require('../lib/mysqhelp');

function standardizeMessage (obj) {

	if (!obj.path) {
		return null;
	}

	if (typeof obj.message !== 'string') {
		return null;
	}

	if (typeof obj.path === "string") {
		obj.path = _.filter(obj.path.split('/'), function (elem) { return elem !== ''; });
	} else if (Object.prototype.toString.call(obj.path) !== '[object Array]') {
		return null;
	}

	if (obj.path.length < 3) {
		return null;
	}

	if (!obj.plurality) {
		obj.plurality = null;
	} else if (+obj.plurality > 1) {
		obj.plurality = 2;
	} else {
		obj.plurality = 1;
	}

	return obj;
}

/**
 * Update the messages stored in the DB.
 *
 * Messages is an array of... messages,
 * where a message is an object like this:
 * {
 * 		path: 		- a string with components separated by forward slashes (/),
 * 					- an array of items representing the path, where an item is a string or an object {name: 'some name', technical_data: 'technical data'}
 * 					the path needs to have a least 3 elements
 * 		message: 	a string
 * 		context: 	a string, optional, defaults to ''
 * 		plurality:  optional, the plurality of the message:
 * 					- null if plurality is not to be taken into account
 * 					- 1 for singular case
 * 					- 2 for plural case
 * 					defaults to null, falsey values are standardized to null, numbers > 1 are standardized to 2, anything else treated as 1
 * 					
 * }
 * 
 */
function updateMessages (connection, messages) {

	var cats;

	// turn the messages into a tree, appending them all to cats
	_.each(messages, function (message) {
		message = standardizeMessage(message);
		if (message) {
			var tree   = treeHelper.makeTreeFromPath(message.path, function (endNode) {
				endNode.messages = [_.omit(message, 'path')];
			});
			cats = treeHelper.mergeTrees(cats, tree, function (prop, oldValue, newValue) {
				if (prop === 'messages') {
					return oldValue.concat(newValue);
				} else {
					return newValue;
				}
			});
		}
	});

	/* Enter the promise land */

	// update the category tree
	return categories.addCategoryTree(connection, cats)
	// retrieve updated categories
	.then(function () {
		return categories.getCategoryTree(connection);
	})
	// merge back our messages into the updated tree
	.then(function (tree) {
		cats = treeHelper.mergeTrees(tree, cats);
		return q(cats);
	})
	// remove classifications of depth >= 3
	.then(function () {
		var toKill = treeHelper.getNodesAtDepth(cats, 3);
		return toKill.reduce(function (soFar, k) {
			
			/* jshint multistr:true */

			var query = 'DELETE Classification FROM Classification \
					     INNER JOIN Category c ON c.id = Classification.category_id \
					     WHERE c.lft BETWEEN ? AND ? \
					    ';

			return soFar.then(mysqhelp.query.bind(null, connection, query, [k.lft, k.rgt]));
		}, q(null));
	})
	// get vendor id
	.then(function() {
		return mysqhelp.insertIgnore(connection, 'Vendor', {name: cats.name});
	})
	// store all the messages
	.then(function (vendorId) {
		return treeHelper.reduce(cats, function (soFar, node) {
			return soFar.then(function (nextPos) {

				if (node.messages) {
					return insertMessages(connection, {
						vendorId: vendorId,
						categoryId: node.id,
						nextPos: nextPos,
						messages: node.messages
					}).then(function () {
						return q(nextPos + node.messages.length);
					});
				} else {
					return q(nextPos);
				}

			});
		}, q(1));
	});
	
}

function insertMessages(connection, data) {
	return data.messages.reduce(function (soFar, message, pos) {
		return soFar.then(function () {

			// insert into Message and get Id
			return mysqhelp.insertIgnore(connection, 'Message', {message: message.message})
			// insert into contextualizedMessage and get id
			.then(function (messageId) {
				return mysqhelp.insertIgnore(connection, 'ContextualizedMessage', {
					vendor_id: data.vendorId,
					message_id: messageId,
					context: message.context,
					plurality: message.plurality
				});
			})
			// insert into classification
			.then(function (contextualizedMessageId) {
				return mysqhelp.query(
					connection,
					'INSERT IGNORE INTO Classification (category_id, contextualized_message_id, position) VALUES (?, ?, ?)',
					[data.categoryId, contextualizedMessageId, data.nextPos + pos]
				);
			});

		});
	}, q(null));
}

exports.updateMessages = updateMessages;
exports.standardizeMessage = standardizeMessage;
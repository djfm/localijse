var q 			= require('q');
var _ 			= require('underscore');

var categories  = require('../db/categories');
var treeHelper 	= require('../lib/tree-helper');
var mysqhelp 	= require('../lib/mysqhelp');

function normalizeIsPlural (is_plural) {
	return is_plural ? 1 : 0;
}

function normalizeMessage (obj) {

	obj = _.clone(obj);

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

	obj.is_plural = normalizeIsPlural(obj.is_plural);

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
 * 		is_plural:  optional, the plurality of the message, boolean defaults to false
 * 					
 * }
 * 
 */
function updateMessages (connection, messages) {

	var cats;

	// turn the messages into a tree, appending them all to cats
	_.each(messages, function (message) {
		message = normalizeMessage(message);
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

	// root is always added implicitely so that everything stays nested under same level
	cats = {
		name: 'root',
		children: [cats]
	};

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
	// get vendor id
	.then(function() {
		return mysqhelp.insertIgnore(connection, 'Vendor', {name: cats.name});
	})
	// store all the messages
	.then(function (vendorId) {
		return treeHelper.reduce(cats, function (soFar, node) {
			return soFar.then(function (nextPos) {

				if (node.messages) {
					// clean the subtree
					return killClassificationsUnderNode(connection, node)
					// insert the messages
					.then(function () {
						return insertMessages(connection, {
							vendorId: vendorId,
							categoryId: node.id,
							nextPos: nextPos,
							messages: node.messages
						});
					})
					// increment position counter
					.then(function () {
						return q(nextPos + node.messages.length);
					});
				} else {
					return q(nextPos);
				}

			});
		}, q(1));
	});
	
}

function killClassificationsUnderNode(connection, node) {			
	/* jshint multistr:true */

	var query = 'DELETE Classification FROM Classification \
			     INNER JOIN Category c ON c.id = Classification.category_id \
			     WHERE c.lft BETWEEN ? AND ? \
			    ';

	return mysqhelp.query(connection, query, [node.lft, node.rgt]);
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
					is_plural: message.is_plural
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
exports.normalizeMessage = normalizeMessage;
exports.normalizeIsPlural = normalizeIsPlural;
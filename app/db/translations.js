var q 			= require('q');
var _ 			= require('underscore');

var mysqhelp 	= require('../lib/mysqhelp');

function addTranslation (connection, user, contextualizedMessageId, data) {
	return q({success: false});
}

exports.addTranslation = addTranslation;
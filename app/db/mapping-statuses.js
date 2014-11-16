var q = require('q');
var _ = require('underscore');

var mysqhelp = require('../lib/mysqhelp');

var allowedStatuses = {
	imported: true,
	translated: true,
	reviewed: true
};

function getMappingStatusId (connection, name) {

	if (!allowedStatuses[name]) {
		return q.reject(new Error('Invalid MappingStatus, should be one of: ' + _.keys(allowedStatuses).join(', ')) + '.');
	}

	return mysqhelp.insertIgnore(connection, 'MappingStatus', {name: name});
}

exports.getMappingStatusId = getMappingStatusId;
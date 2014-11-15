var q = require('q');
var _ = require('underscore');

var mysqhelp = require('../lib/mysqhelp');

function User (data) {
	var almighty;

	this.setAlmighty = function setAlmighty (isAlmighty) {
		almighty = isAlmighty;
		return this;
	};

	this.checkAllowedToTranslate = function (locale) {
		if (almighty) {
			return q(true);
		} else {
			return q.reject(false);
		}
	};

	this.save = function (connection) {
		if (!data.username) {
			return q.reject(new Error('Missing username.'));
		}

		var that = this;

		return mysqhelp.upsert(connection, 'User', _.pick(data, 'username'))
		.then(function (userId) {
			data.id = userId;
			return q(that);
		});
	};

	this.getId = function () {
		return data.id;
	};

	this.getUsername = function () {
		return data.username;
	};
}

function addUser (connection, user) {
	if (!(user instanceof User)) {
		user = new User(user);
	}

	return user.save(connection);
}

exports.User = User;
exports.addUser = addUser;
var q = require('q');

function User(data) {
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
}

exports.User = User;
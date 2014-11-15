function User(data) {
	var almighty;

	this.setAlmighty = function setAlmighty (isAlmighty) {
		almighty = isAlmighty;
		return this;
	};
}

exports.User = User;
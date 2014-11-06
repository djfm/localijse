/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE User (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		username VARCHAR (128) NOT NULL, \
		UNIQUE KEY (username) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('User', callback);
};
/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Message (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		message TEXT NOT NULL, \
		UNIQUE KEY (message (255)) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Message', callback);
};
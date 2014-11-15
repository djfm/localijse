/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Translation (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		language_id INT UNSIGNED NOT NULL, \
		translation TEXT NOT NULL, \
		UNIQUE KEY (language_id, translation (255)), \
		FOREIGN KEY (language_id) REFERENCES Language (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Translation', callback);
};
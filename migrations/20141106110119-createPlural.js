/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Plural (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		language_id INT UNSIGNED NOT NULL, \
		is_plural TINYINT UNSIGNED NOT NULL DEFAULT 0, \
		plurality TINYINT UNSIGNED NOT NULL, \
		KEY (language_id, plurality), \
		UNIQUE KEY (language_id, is_plural, plurality), \
		CONSTRAINT FOREIGN KEY (language_id) REFERENCES Language (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Plural', callback);
};
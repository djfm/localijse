/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Language (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		locale VARCHAR (16), \
		name VARCHAR (255), \
		plural_rule TINYINT UNSIGNED NULL, \
		n_plurals TINYINT UNSIGNED NULL, \
		CONSTRAINT UNIQUE KEY (locale) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Language', callback);
};
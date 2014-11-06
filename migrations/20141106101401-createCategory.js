/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Category (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		lft INT UNSIGNED NOT NULL, \
		rgt INT UNSIGNED NOT NULL, \
		name VARCHAR (128) NOT NULL, \
		technical_data MEDIUMBLOB NULL, \
		CONSTRAINT UNIQUE KEY (lft, rgt, name), \
		KEY (lft, rgt) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Category', callback);
};
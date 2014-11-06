/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE MappingStatus (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		name VARCHAR (128) NOT NULL, \
		UNIQUE KEY (name) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('MappingStatus', callback);
};
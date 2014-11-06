/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE ContextualizedMessage (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		message_id INT UNSIGNED NOT NULL, \
		context VARCHAR (255) NOT NULL, \
		plurality TINYINT UNSIGNED NULL DEFAULT NULL, \
		CONSTRAINT UNIQUE KEY (message_id, context, plurality), \
		CONSTRAINT FOREIGN KEY (message_id) REFERENCES Message (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('ContextualizedMessage', callback);
};
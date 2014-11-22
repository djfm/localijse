/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE ContextualizedMessage (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		vendor_id INT UNSIGNED NOT NULL, \
		message_id INT UNSIGNED NOT NULL, \
		context VARCHAR (255) NOT NULL, \
		is_plural TINYINT UNSIGNED NOT NULL DEFAULT 0, \
		KEY (id, is_plural), \
		CONSTRAINT UNIQUE KEY ContextualizedMessage_Unicity (vendor_id, message_id, context, is_plural), \
		CONSTRAINT FOREIGN KEY (message_id) REFERENCES Message (id), \
		CONSTRAINT FOREIGN KEY (vendor_id) REFERENCES Vendor (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('ContextualizedMessage', callback);
};
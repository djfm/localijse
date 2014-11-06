/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Classification (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		category_id INT UNSIGNED NOT NULL, \
		contextualized_message_id INT UNSIGNED NOT NULL, \
		position INT UNSIGNED NOT NULL, \
		CONSTRAINT UNIQUE KEY (category_id, contextualized_message_id), \
		KEY (position), \
		CONSTRAINT FOREIGN KEY (category_id) REFERENCES Category (id), \
		CONSTRAINT FOREIGN KEY (contextualized_message_id) REFERENCES ContextualizedMessage (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Classification', callback);
};
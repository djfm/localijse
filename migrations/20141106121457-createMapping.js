/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE Mapping (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		contextualized_message_id INT UNSIGNED NOT NULL, \
		language_id INT UNSIGNED NOT NULL, \
		plurality TINYINT UNSIGNED NOT NULL, \
		mapping_version_id INT UNSIGNED NOT NULL, \
		UNIQUE KEY (contextualized_message_id, language_id, plurality), \
		UNIQUE KEY (mapping_version_id), \
		CONSTRAINT FOREIGN KEY (contextualized_message_id) REFERENCES ContextualizedMessage (id), \
		CONSTRAINT FOREIGN KEY (language_id) REFERENCES Language (id), \
		CONSTRAINT FOREIGN KEY (mapping_version_id) REFERENCES MappingVersion (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin;";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('Mapping', callback);
};
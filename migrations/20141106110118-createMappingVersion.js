/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE MappingVersion (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		translation_id INT UNSIGNED NOT NULL, \
		mapping_status_id INT UNSIGNED NOT NULL, \
		created_by INT UNSIGNED NOT NULL, \
		reviewed_by INT UNSIGNED NOT NULL, \
		created_at DATETIME NOT NULL, \
		updated_at DATETIME NOT NULL, \
		KEY (translation_id), \
		KEY (mapping_status_id), \
		KEY (created_by), \
		KEY (reviewed_by), \
		KEY (created_at), \
		KEY (updated_at), \
		CONSTRAINT FOREIGN KEY (translation_id) REFERENCES Translation (id), \
		CONSTRAINT FOREIGN KEY (mapping_status_id) REFERENCES MappingStatus (id), \
		CONSTRAINT FOREIGN KEY (created_by) REFERENCES User (id), \
		CONSTRAINT FOREIGN KEY (reviewed_by) REFERENCES User (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('MappingVersion', callback);
};
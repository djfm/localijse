/* jshint multistr:true */

exports.up = function(db, callback) {
	
	var query = "CREATE TABLE MappingHistory (\
		id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT, \
		mapping_id INT UNSIGNED NOT NULL, \
		mapping_version_id INT UNSIGNED NOT NULL, \
		KEY (mapping_id), \
		KEY (mapping_version_id), \
		CONSTRAINT FOREIGN KEY (mapping_id) REFERENCES Mapping (id), \
		CONSTRAINT FOREIGN KEY (mapping_version_id) REFERENCES MappingVersion (id) \
	) ENGINE INNODB, CHARACTER SET utf8, COLLATE utf8_bin;";

	db.runSql(query, callback);
};

exports.down = function(db, callback) {
	db.dropTable('MappingHistory', callback);
};
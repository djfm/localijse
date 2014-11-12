var fs 			= require('fs');
var mysql 		= require('mysql');
var q 			= require('q');
var spawn 		= require('child_process').spawn;
var _ 			= require('underscore');

var categories 	= require('./db/categories');
var messages 	= require('./db/messages');
var search	 	= require('./db/search');

function Localijse(config) {

	var connection = mysql.createConnection(config.database);

	this.resetDatabase = function() {

		var d = q.defer();

		if (config.environment === 'test') {

			var connection = mysql.createConnection(_.omit(config.database, 'database'));

			connection.query('DROP DATABASE IF EXISTS ??', [config.database.database], function (err) {
				if (err) {
					d.reject(err);
				} else {
					connection.query('CREATE DATABASE ??', [config.database.database], function (err) {
						if (err) {
							d.reject('Could not create database: ' + err);
						} else {
							spawn(
								'node_modules/.bin/db-migrate',
								['up', '--env', config.environment],
								{cwd: __dirname + '/../'}
							).on('close', function(code) {
								if (code === 0) {
									d.resolve();
								} else {
									d.reject("db-migrate returned error: " + code);
								}
							});
						}
					});
				}
			});
		} else {
			d.reject('Will not resetDatabase in `' + config.environment + '` environment, unsafe.');
		}

		return d.promise;
	};

	// Proxy'ed functions:

	this.addCategoryPath = categories.addCategoryPath.bind(this, connection);
	this.addCategoryTree = categories.addCategoryTree.bind(this, connection);
	this.getCategoryTree = categories.getCategoryTree.bind(this, connection);

	this.findMessages	 = search.findMessages.bind(this, connection);
	this.updateMessages  = messages.updateMessages.bind(this, connection);
	
	this.addTranslation = null;
}

exports.init = function (environment) {
	var configPath = __dirname + '/../database.json';

	if (!fs.existsSync(configPath)) {
		throw new Error("Missing configuration file: " + configPath);
	}

	var config = JSON.parse(fs.readFileSync(configPath).toString());

	var databaseSettings = config[environment];

	if (!databaseSettings) {
		throw new Error("No environment settings found for " + environment);
	}

	return new Localijse({
		database: databaseSettings,
		environment: environment
	});
};
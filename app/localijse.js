var fs 				= require('fs');
var mysql 			= require('mysql');
var q 				= require('q');
var spawn 			= require('child_process').spawn;
var _ 				= require('underscore');

var categories 		= require('./db/categories');
var languages 		= require('./db/languages');
var mappingStatuses = require('./db/mapping-statuses');
var messages 		= require('./db/messages');
var mysqhelp   		= require('./lib/mysqhelp');
var search	 		= require('./db/search');
var translations	= require('./db/translations');
var users			= require('./auth/users');

function Localijse(config) {

	var connection = mysql.createConnection(config.database);

	this.resetDatabase = function() {
		if (config.environment === 'test') {
			var connection = mysql.createConnection(_.omit(config.database, 'database'));
			return mysqhelp
			.query(connection, 'DROP DATABASE IF EXISTS ??', [config.database.database])
			.then(function () {
				return mysqhelp.query(connection, 'CREATE DATABASE ??', [config.database.database]);
			}).then(function () {
				var d =  q.defer();
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

				return d.promise;
			});
		} else {
			return q.reject('Will not resetDatabase in `' + config.environment + '` environment, unsafe.');
		}
	};

	// Proxy'ed functions:

	this.addCategoryPath 	= categories.addCategoryPath.bind(undefined, connection);
	this.addCategoryTree 	= categories.addCategoryTree.bind(undefined, connection);
	this.getCategoryTree 	= categories.getCategoryTree.bind(undefined, connection);

	this.findMessages	 	= search.findMessages.bind(undefined, connection);
	this.updateMessages  	= messages.updateMessages.bind(undefined, connection);
	
	this.addLanguage 		= languages.addLanguage.bind(undefined, connection);
	this.findLanguage 		= languages.findLanguage.bind(undefined, connection);

	this.addTranslation 	= translations.addTranslation.bind(undefined, connection);

	this.addUser			= users.addUser.bind(undefined, connection);
	this.findUser			= users.findUser.bind(undefined, connection);

	this.getMappingStatusId	= mappingStatuses.getMappingStatusId.bind(undefined, connection);
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
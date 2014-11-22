var fs 				= require('fs');
var mysql 			= require('mysql');
var SqlString		= require('mysql/lib/protocol/SqlString');
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

	var connectionConfig = config.database;

	connectionConfig.queryFormat = function (sql, values) {
		if (!values) {
			return sql;
		}

		if (Object.prototype.toString.call(values) === '[object Array]') {
			return SqlString.format(sql, values, this.config.stringifyObjects, this.config.timezone);
		}

		return sql.replace(/\:(\w+)/g, function (txt, key) {
			if (values.hasOwnProperty(key)) {
				return this.escape(values[key]);
			} else {
				return txt;
			}

		}.bind(this));
	};

	var connectionPool = mysql.createPool(_.extend(connectionConfig, {connectionLimit: 2}));

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

	var proxiedFunctionsNeedingConnection = [
		[categories, ['addCategoryPath', 'addCategoryTree', 'getCategoryTree']],
		[search, ['find']],
		[messages, ['updateMessages']],
		[languages, ['addLanguage', 'findLanguage']],
		[translations, ['addTranslation']],
		[users, ['addUser', 'findUser']],
		[mappingStatuses, ['getMappingStatusId']]
	];

	/**
	 * Proxy module functionality
	 */

	var that = this;
	_.each(proxiedFunctionsNeedingConnection, function (moduleAndFunctions) {
		var mod = moduleAndFunctions[0];
		_.each(moduleAndFunctions[1], function (fun) {
			that[fun] = function () {

				var d = q.defer();

				var args = _.toArray(arguments);

				connectionPool.getConnection(function (err, connection) {
					if (err) {
						d.reject(err);
					} else {
						args.unshift(connection);
						mod[fun].apply(undefined, args).then(function (value) {
							connection.release();
							d.resolve(value);
						}, function (err) {
							d.reject(err);
						});
					}
				});

				return d.promise;
			};
		});
	});
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
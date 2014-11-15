var q 			= require('q');
var _ 			= require('underscore');

var languages 	= require('../db/languages');
var messages 	= require('../db/messages');
var mysqhelp 	= require('../lib/mysqhelp');

function addTranslation (connection, user, contextualizedMessageId, data) {

	var locale = languages.standardizeLocale(data.locale);

	if (!locale) {
		return q.reject('Invalid locale.');
	}

	if (typeof data.translation !== 'string') {
		return q.reject('Invalid translation, must be a string.');
	}

	if (!contextualizedMessageId) {
		return q.reject('Missing contextualizedMessageId.');
	}

	var contextualized_message_id = contextualizedMessageId.contextualized_message_id || contextualizedMessageId;
	var language_id;
	var plurality = messages.standardizePlurality(data.plurality, true);

	return user.checkAllowedToTranslate(locale)
	.then(function () {
		return languages.findLanguage(connection, locale);
	})
	.then(function (language) {
		language_id = language.id;
		return mysqhelp.insertIgnore(connection, 'Translation', {language_id: language_id, translation: data.translation});
	}).then(function (translation_id) {
		console.log(translation_id);
	});

}

exports.addTranslation = addTranslation;
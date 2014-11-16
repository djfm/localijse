var q 			= require('q');
var _ 			= require('underscore');

var languages 			= require('../db/languages');
var messages 			= require('../db/messages');
var mappingStatuses 	= require('../db/mapping-statuses');
var mysqhelp 			= require('../lib/mysqhelp');

function addTranslation (connection, user, contextualizedMessageId, data) {

	var locale = languages.normalizeLocale(data.locale);

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
	var language_id, translation_id, mapping_status_id, mapping_version_id, mapping_id;
	var plurality = messages.normalizePlurality(data.plurality, true);

	return user.checkAllowedToTranslate(locale)
	/**
	 * Get the things we need for the MappingVersion
	 */
	.then(function () {
		return languages.findLanguage(connection, locale);
	})
	.then(function (language) {
		language_id = language.id;
		return mysqhelp.insertIgnore(connection, 'Translation', {language_id: language_id, translation: data.translation});
	})
	.then(function (translationId) {
		translation_id = translationId;
		return mappingStatuses.getMappingStatusId(connection, data.mappingStatus);
	})
	.then(function (statusId) {
		mapping_status_id = statusId;
	})
	/**
	 * Create the mapping version
	 */
	.then(function () {
		return mysqhelp.insert(connection, 'MappingVersion', {
			translation_id: translation_id,
			mapping_status_id: mapping_status_id,
			created_by: user.getId(),
			reviewed_by: user.getId(),
			created_at: new Date()
		});
	}).then(function (mappingVersionId) {
		mapping_version_id = mappingVersionId;
	})
	/**
	 * Create or update the mapping
	 */
	.then(function () {
		return mysqhelp.upsert(
			connection,
			'Mapping',
			{
				contextualized_message_id: contextualized_message_id,
				language_id: language_id,
				plurality: plurality
			},
			{
				mapping_version_id: mapping_version_id
			}
		);
	})
	/**
	 * Update history
	 */
	.then(function (mappingId) {
		mapping_id = mappingId;
		return mysqhelp.insert(connection, 'MappingHistory', {mapping_id: mapping_id, mapping_version_id: mapping_version_id});
	});
}

exports.addTranslation = addTranslation;
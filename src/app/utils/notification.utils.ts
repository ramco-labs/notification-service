'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	config = require('../../config/config'),
	emailUtils = require('./email.utils'),
	axios = require('axios'),
	swig = require('swig'),
	nodemailer = require('nodemailer'),
	apn = require('apn'),
	mongoose = require('mongoose'),
	path = require('path'),
	metrics = require('../utils/metrics.utils');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

var NotificationQueue = mongoose.model('NotificationQueue');

const client = require('twilio')(config.twilio.sid, config.twilio.token);

/**
 * FCM PUSH UTILITY FUNCTIONS
 */


var notificationSent = function (notificationId, callback) {
	if (!notificationId) {
		return;
	}
	NotificationQueue.update({ _id: mongoose.Types.ObjectId(notificationId) }, { $set: { sent: new Date() } }, function (err) {
		if (err) {
			return callback(err, { message: 'Unable to update notification status' });
		}
		return callback(err, { message: 'The notification status has been updated successfully' });
	});
};


/**
 * FCM PUSH NOTIFICATIONS
 */

var sendPushNotificationHelper = function (notificationOptions, payload, callback) {
	notificationOptions.data = payload;
	axios(notificationOptions).then(function (response) {
		callback(response.data);
	}).catch(function (error) {
		metrics.pushNotificationFailureCount();
		callback(error);
	});
};

var sendPushNotification = function (regidList, obj, notificationId) {

	var m, n, chunk = 999;
	if (obj.type !== 'image' && obj.type !== 'basic' && obj.type !== 'list') obj.type = 'basic';
	if (typeof obj.title === 'undefined') obj.title = 'Hello World';
	if (typeof obj.message === 'undefined') obj.message = 'New updates available';
	if (typeof obj.iconUrl === 'undefined') obj.iconUrl = config.app.url + '/img/logo.svg';
	if (typeof obj.imageUrl === 'undefined') obj.imageUrl = config.app.url + '/img/logo.svg';
	if (typeof obj.items === 'undefined') obj.items = [{ 'title': 'List 1', 'message': 'List 1' }, { 'title': 'List 2', 'message': 'List 2' }];
	if (typeof obj.notificationURL === 'undefined') obj.notificationURL = config.app.url;
	obj.buttons = [{ 'title': 'Open App' }, { 'title': 'Snooze' }];

	var payload = {
		'data': {
			'type': obj.type,
			'title': obj.title,
			'message': obj.message,
			'iconUrl': obj.iconUrl,
			'imageUrl': obj.imageUrl,
			'buttons': obj.buttons,
			'items': obj.items,
			'notificationURL': obj.notificationURL
		},
		'notification': {
			'body': obj.message,
			'title': obj.title,
			'icon': obj.iconUrl,
			'sound': 'default',
			'click_action': 'FCM_PLUGIN_ACTIVITY'
		},
		'priority': 'high',
		'content_available': true
	};

	// An object of options to indicate where to post to
	var notificationOptions = {
		url: config.fcs.host + config.fcs.path,
		method: 'post',
		responseType: 'json',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': config.fcs.AuthorizationKey
		}
	};

	for (m = 0, n = regidList.length; m < n; m += chunk) {
		payload["registration_ids"] = regidList.slice(m, m + chunk);
		sendPushNotificationHelper(notificationOptions, payload, function (response) { metrics.pushNotificationCount(); notificationSent(notificationId, function () { }); });
	}

};

var getAPNSConfig = function (bundleId) {
	var bundleArray = bundleId.split('.');
	return config.apns[bundleArray[bundleArray.length - 1]] || {};
};

var sendAPNSPushNotification = function (obj, notificationId, callback) {
	var apnsConfig = getAPNSConfig(obj.options.topic);

	var options = {
		pfx: path.join(__dirname, "../keys/" + (obj.creds.pfx || apnsConfig.pfx)),
		passphrase: apnsConfig.passphrase,
		production: obj.production || true
	};

	if (obj.proxy) {
		options["proxy"] = obj.proxy;
	}

	var apnProvider = new apn.Provider(options);
	let deviceTokens = obj.creds.tokens;

	var note = new apn.Notification();

	note.expiry = obj.options.expiry || Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	note.badge = obj.options.badge || 3;
	note.sound = obj.options.sound || "ping.aiff";
	note.alert = obj.options.alert || "\uD83D\uDCE7 \u2709 You have a new message";
	note.payload = obj.options.payload || { 'message': 'You have a new update' };
	note.topic = obj.options.topic;

	apnProvider.send(note, deviceTokens).then((response) => {
		metrics.apnsPushNotificationCount();
		if (response.failed && response.failed.length > 0) {
			metrics.apnsPushNotificationFailureCount();
			console.log('failed to send notification to Device IDs ', response.failed);
		}
		notificationSent(notificationId, function () { });
		return callback(null, { message: 'Notification successfully sent' });
	});
};

var sendEmailNotification = function (emailObj, notificationId, callback) {
	var mailOptions = emailObj.mailOptions;
	var emailData = emailObj.emailData;
	var templateURL = emailObj.templateURL;
	var smtpOptions;
	if (emailObj.smtp) {
		smtpOptions = emailObj.smtp.options;
	} else {
		smtpOptions = config.mailer.options;
	}

	// mailOptions.to = emailUtils.sanitizeEmail(mailOptions.to);

	emailData.emailBody = entities.decode(emailData.emailBody);

	swig.renderFile(templateURL, emailData, function (err, emailHTML) {

		mailOptions.html = emailHTML;

		if (err) {
			console.log(err);
			console.log('error', 'Error in sending email notification' + JSON.stringify(mailOptions) + templateURL + emailData, {});
			return callback(err, { message: 'Error in sending email' });
		} else {
			var smtpTransport = nodemailer.createTransport(smtpOptions);

			//  NOTE : Hack to handle redirect emails for example.com domain.
			if (mailOptions.to.constructor !== Array) {
				if (mailOptions.to.replace(/.*@/, '') === 'example.com') {
					mailOptions.subject = mailOptions.subject + ' for ' + mailOptions.to;
					mailOptions.to = 'youremail@example.com';
				}
			}

			smtpTransport.sendMail(mailOptions, function (err) {
				metrics.emailCount();
				if (err) {
					metrics.emailFailureCount();
					console.log('err in sending mail:', err);
					console.log('error', 'Error in sending email notification' + JSON.stringify(mailOptions) + templateURL + emailData, {});
					return callback(err, { message: 'Error in sending email' });
				} else {
					notificationSent(notificationId, function () { });
					return callback(err, { message: 'Email successfully sent' });
				}
			});
		}
	});
};


/**
 * PUSH TO A WEBHOOK URL
 */

var pushToWebhook = function (webhookURL, payload, mainCallback, notificationId) {
	var options = {
		url: webhookURL,
		method: 'post',
		responseType: 'json',
		headers: {
			'User-Agent': 'request'
		},
		data: payload
	};

	/**
	 * Webhook Callback specifying notification status
	 * @param error 
	 * @param response 
	 * @param body 
	 */
	function callback(error, response, body) {
		metrics.pushToWebhookCounter();
		if (!error && response.statusCode === 200) {
			if (notificationId) notificationSent(notificationId, function () { });
			mainCallback({ message: 'Notification pushed', error: null });
		} else {
			metrics.pushToWebhookFailureCounter();
			mainCallback({ message: 'Notification push failed!', error: error });
		}
	}

	axios(options, callback);
};

var sendSMS = function (smsObj, notificationId, callback) {
	client.messages
		.create({
			body: smsObj.message,
			to: smsObj.to,
			from: smsObj.from
		}, function (err, message) {
			metrics.smsCount();
			if(err){
				metrics.smsFailureCount();
				return callback;
			}
			console.log('Sent an SMS:', err, message.sid);
			notificationSent(notificationId, function () { });
		});
};

var makeCall = function (callObj, notificationId, callback) {
	client.calls
		.create({
			url: config.app.url + '/api/render/call/twiml?msg=' + encodeURI(callObj.message),
			to: callObj.to,
			from: callObj.from
		}, function (err, call) {
			metrics.callCount();
			if (err) {
				console.log('error occured:', err);
				metrics.callFailureCount();
				return callback(err, { message: 'Error in making call' });
			}
			console.log('Made a call:', err, call.sid);
			notificationSent(notificationId, function () { });
		});
};

var socketCall = function (socketObj, notificationId, callback) {
	global["wss"].broadcast(socketObj);
	metrics.socketCallCount();
	console.log('Sent a broadcast:', JSON.stringify(socketObj));
	notificationSent(notificationId, function () { });
};

exports.socketCall = socketCall;
exports.sendSMS = sendSMS;
exports.makeCall = makeCall;
exports.pushToWebhook = pushToWebhook;
exports.sendPushNotification = sendPushNotification;
exports.sendAPNSPushNotification = sendAPNSPushNotification;
exports.sendEmailNotification = sendEmailNotification;

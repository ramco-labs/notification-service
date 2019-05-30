'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	notificationUtils = require('../../utils/notification.utils'),
	moment = require('moment'),
	NotificationQueue = mongoose.model('NotificationQueue');

/**
* NOTIFICATION QUEUE FUNCTIONS
*/

exports.addToQueue = function (notificationObj, callback) {
	notificationObj["retryCount"] = 0;
	NotificationQueue.collection.insert(notificationObj, function (err) {
		if (err) {
			console.log('error', 'Error in adding notification to queue' + JSON.stringify(err), {});
			return callback(err, { message: 'Unable to add the notification to the queue' });
		}
		return callback(err, { message: 'The notification has been added successfully to the queue' });
	});
};

exports.removeFromQueue = function (queueId, callback) {
	NotificationQueue.remove({ _id: mongoose.Types.ObjectId(queueId) }, function (err) {
		if (err) {
			console.log('error', 'Unable to remove the notification from the queue' + JSON.stringify(err), {});
			return callback(err, { message: 'Unable to remove the notification from the queue' });
		}
		return callback(err, { message: 'The notification has been removed successfully from the queue' });
	});
};

var addRetry = function (notificationId) {
	NotificationQueue.findOneAndUpdate({ _id: mongoose.Types.ObjectId(notificationId) }, { '$inc': { retryCount: 1 } }, { new: true, upsert: true }).exec(function (err, queue) {
		if (err) {
			console.log('Error in updating retries..', err);
		}
		console.log('Retrying ' + notificationId + ' again on ' + new Date().toISOString());
	});
};


var parseNotificationQueue = function (notificationItem) {
	addRetry(notificationItem._id);
	if (notificationItem.metaData.fcm_push) {
		notificationUtils.sendPushNotification(notificationItem.metaData.fcm_push.regid, notificationItem.metaData.fcm_push, notificationItem._id);
	}

	if (notificationItem.metaData.apns_push) {
		notificationUtils.sendAPNSPushNotification(notificationItem.metaData.apns_push, notificationItem._id, function () { });
	}

	if (notificationItem.metaData.email) {
		notificationUtils.sendEmailNotification(notificationItem.metaData.email, notificationItem._id, function () { });
	}

	if (notificationItem.metaData.webhook) {
		notificationUtils.pushToWebhook(notificationItem.metaData.webhook.url, notificationItem.metaData.webhook.body, function () { }, notificationItem._id);
	}

	if (notificationItem.metaData.sms) {
		notificationUtils.sendSMS(notificationItem.metaData.sms, notificationItem._id, function () { });
	}

	if (notificationItem.metaData.call) {
		notificationUtils.makeCall(notificationItem.metaData.call, notificationItem._id, function () { });
	}

	if (notificationItem.metaData.websocket) {
		notificationUtils.socketCall(notificationItem.metaData.websocket, notificationItem._id, function () { });
	}
};

exports.processQueueHelper = function (criteriaObj, callback) {
	var queryMap = {};
	queryMap["retryCount"] = {};

	if (criteriaObj.fromDate || criteriaObj.thruDate) {
		queryMap["created"] = {};
	}

	if (criteriaObj.fromDate) {
		queryMap["created"]["$gte"] = moment(new Date(criteriaObj.fromDate)).toDate();
	}

	if (criteriaObj.thruDate) {
		queryMap["created"]["$lt"] = moment(new Date(criteriaObj.thruDate)).toDate();
	}

	queryMap["sent"] = { $exists: false };
	queryMap["retryCount"]["$lt"] = 5;

	var limit = criteriaObj.limit || 1000;
	var skip = criteriaObj.skip || 0;
	skip = parseInt(skip);
	limit = parseInt(limit);

	var query = NotificationQueue.find(queryMap);
	query.limit(limit).skip(skip);
	query.exec(function (err, queue) {
		if (err) {
			console.log('error', 'Error with notifications:' + JSON.stringify(err), {});
			return callback(err, { message: 'OOPS! Looks like some error occured in processing the notifications' });
		}

		if (queue.length === 0) {
			return callback(err, { message: 'Looks like there is no notification to be processed right now.' });
		}
		var diff;
		for (var i = 0; i < queue.length; i++) {
			diff = moment(new Date(queue[i].scheduled)).diff(new Date(), 'minutes');
			if (queue[i].scheduled) {
				if (diff <= 3) {
					parseNotificationQueue(queue[i]);
				}
			} else {
				parseNotificationQueue(queue[i]);
			}
		}
	});
};

export { };
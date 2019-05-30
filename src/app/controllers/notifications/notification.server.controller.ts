'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
	Registration = require('mongoose').model('Registration');

let config = require('../../../config/config');

let notificationModule = require('./notification.modules');
import * as initTracer from '../../utils/tracing.utils';
import { log } from '../../utils/error.utils';

exports.sendNotification = function (req, res) {
	let parentSpan = initTracer.initTracer("ml-platform", config.app.title, req.headers);

    const notificationSpan = global[ "tracer" ].startSpan("notificationEmail", { childOf: parentSpan });


	let notificationObj = { metaData: {}, notificationType: 'api' };
	
	if (!req.body.channel) {
		return res.status(400).jsonp({ message: 'Please add the channel information to send notifications.' });
	}

	if (req.body.scheduled) {
		notificationObj["scheduled"] = new Date(req.body.scheduled);
	}

		if (req.body.channel.email) {
		notificationObj.metaData["email"] = req.body.channel.email;
		if (notificationObj.metaData["email"]["templateURL"]) {
			notificationObj.metaData["email"]["templateURL"] = path.join(__dirname, notificationObj.metaData["email"]["templateURL"]);
		} else {
			notificationObj.metaData["email"]["templateURL"] = path.join(__dirname, "../../views/templates/generic-email.server.view.html");
		}
		if (notificationObj.metaData["email"]["mailOptions"]["to"].constructor !== Array) {
			notificationObj.metaData["email"]["mailOptions"]["to"] = notificationObj.metaData["email"]["mailOptions"]["to"].toLowerCase();
			notificationObj.metaData["email"]["mailOptions"]["from"] = notificationObj.metaData["email"]["mailOptions"]["from"].toLowerCase();
		}
	}
	log('info', {
		message: 'email notification details',
		notificationObj:  notificationObj
		
	}, notificationSpan);
	if (req.body.channel.call) {
		//TODO: ADD VALIDATING CLEANING UP TO NUMBER
		notificationObj.metaData["call"] = req.body.channel.call;
	}

	if (req.body.channel.bot) {
		notificationObj.metaData["bot"] = req.body.channel.bot;
	}

	if (req.body.channel.fcm_push) {
		notificationObj.metaData["fcm_push"] = req.body.channel.fcm_push;
		notificationObj.metaData["fcm_push"]["type"] = req.body.channel.fcm_push.type || 'basic';
		if (req.body.channel.fcm_push.message == "An error occured!") {
			return res.status(400).jsonp({ message: "An error occured!" });
		}
	}

	if (req.body.channel.apns_push) {
		notificationObj.metaData["apns_push"] = req.body.channel.apns_push;
	}

	if (req.body.channel.sms) {
		notificationObj.metaData["sms"] = req.body.channel.sms;
	}

	if (req.body.channel.webhook) {
		notificationObj.metaData["webhook"] = req.body.channel.webhook;
	}

	if (req.body.channel.websocket) {
		notificationObj.metaData["websocket"] = req.body.channel.websocket;
	}

	//Adding and processing queues instantly as of now
	notificationModule.addToQueue(notificationObj, function (err, response) {
		if (err) {
			log('error', {
				message: 'error in sending email notification',
				err: err
			}, notificationSpan);	
		}
		log('info', {
			message: 'email notification sent',
			response: response
		}, notificationSpan);
		//TO BE CALLED BY THE CRON LATER
		notificationModule.processQueueHelper({}, function (err, response) {
			if (err) {
				log('error', {
					message: 'error in processQueueHelper',
					err: err
				}, notificationSpan);	
			}
			log('info', {
				message: 'processQueueHelper successful',
				response: response
			}, notificationSpan);
		});

		res.status(200).jsonp({ message: response });
	});
	
	notificationSpan.finish();
	parentSpan.finish();
};

exports.processQueue = function (req, res) {
	var criteria = req.body.criteria || {};
	notificationModule.processQueueHelper(criteria, function (err, response) {
		console.log('err:', err, 'response:', response);
		res.status(200).jsonp({ message: 'Queue processed successfully!' });
	});
};

exports.renderTwimlCall = function (req, res) {
	var twiml = `<?xml version="1.0" encoding="UTF-8"?>
						<Response>
						<Say voice="alice">${decodeURI(req.query.msg)}</Say>
					</Response>`;

	res.type('text/xml');
	res.send(twiml);
};

exports.register = function (req, res) {
	var reqBody = req.body;

	if (!reqBody.uid) {
		return res.status(400).jsonp({ message: "Please provide a value for uid to do the registration!" });
	}

	var registrationObj = {
		uid: reqBody.uid,
		status: reqBody.status || "active"
	};

	if (reqBody.context) registrationObj["context"] = reqBody.context;

	var query = { 'uid': reqBody.uid };

	Registration.findOneAndUpdate(query, { $set: registrationObj }, { upsert: true }, function (err, doc) {
		if (err) {
			console.log("Error:", err);
			return res.status(500).jsonp({ message: "An error occured!" });
		}
		return res.status(200).jsonp({ message: "Registration successful" });
	});
};

exports.getUser = function (req, res) {
	if (!req.params.uid) {
		return res.status(400).jsonp({ message: "Please provide a value for uid to get the info!" });
	}

	var uid = req.params.uid;

	var query = { 'uid': uid };

	Registration.findOne(query, function (err, doc) {
		if (err) {
			console.log("Error:", err);
			return res.status(500).jsonp({ message: "An error occured!" });
		}
		res.status(200).jsonp({ message: "success", user: doc });
	});
};

exports.deRegister = function (req, res) {
	var reqBody = req.body;
	if (!reqBody.uid) {
		return res.status(400).jsonp({ message: "Please provide a value for uid to do the registration!" });
	}

	var query = { 'uid': reqBody.uid };

	Registration.findOneAndUpdate(query, { $set: { status: "inactive" } }, { upsert: false }, function (err, doc) {
		if (err) {
			console.log("Error:", err);
			return res.status(500).jsonp({ message: "An error occured!" });
		}
		return res.status(200).jsonp({ message: "De-Registration successful" });
	});
};

exports.registerPlatform = function (req, res) {
	var reqBody = req.body;

	reqBody.platformContext = req.body.platformContext || {};

	if (!reqBody.uid || !reqBody.platformid) {
		return res.status(400).jsonp({ message: "Please provide a value for uid and platformid to do the registration!" });
	}

	var query = { 'uid': reqBody.uid };

	Registration.findOne(query, function (err, user) {
		if (typeof user.platforms !== 'undefined') {
			// check if already registered in which case skip and return

			for (var i = 0; i < user.platforms.length; i++) {
				if (user.platforms[i].platformid === reqBody.platformid) {
					return res.status(200).jsonp({ status: 'success' });
				}
			}

		} else {
			user.platforms = [];
		}

		var platform = {
			type: reqBody.type,
			version: reqBody.version,
			platformid: reqBody.platformid,
			platformContext: reqBody.platformContext,
			status: 'active',
			created: new Date()
		};

		user.platforms.push(platform);
		user.save(function (err) {
			if (err) {
				return res.status(500).jsonp({
					error: 'Cannot save device registration'
				});
			} else {
				return res.status(200).jsonp({ status: 'success' });
			}
		});
	});
};

exports.deRegisterPlatform = function (req, res) {
	var reqBody = req.body;

	if (!reqBody.uid || !reqBody.platformid) {
		return res.status(400).jsonp({ message: "Please provide a value for uid and platformid to unsubscribe!" });
	}

	var query = { 'uid': reqBody.uid, 'platforms.platformid': reqBody.platformid };

	Registration.update(query, { $set: { 'platforms.$.status': 'inactive' } }, function (err, user) {
		if (err) {
			return res.status(500).jsonp({
				error: 'Cannot de-register device!'
			});
		} else {
			return res.status(200).jsonp({ status: 'success', user: user });
		}
	});
};


//UNCOMMENT THIS BLOCK IF NOT USING SCHEDULER SERVER ALONG WITH NOTIFICATION SERVICE
// if (!global["j"]) {
// 	global["j"] = schedule.scheduleJob('*/1 * * * *', function () {
// 		notificationModule.processQueueHelper({}, function (err, response) {
// 			console.log(`Queue processed at ${new Date().toString()} , Error - ${err}, Response - ${JSON.stringify(response)}`);
// 		});
// 	});
// }
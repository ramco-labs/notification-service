'use strict';

module.exports = {
	app: {
		title: 'Notification server',
		description: 'Notification server',
		url: 'http://localhost'
	},
	port: process.env.NODEJS_NOTIFICATION_SERVICE_PORT ,
	hostname: process.env.NODEJS_NOTIFICATION_SERVICE_HOST,
	templateEngine: 'swig'
};

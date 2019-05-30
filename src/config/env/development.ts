'use strict';

module.exports = {
	app: {
		title: 'Notification service',
		description: 'Notification service',
		url: 'http://localhost:8085'
	},
	port: process.env.NODEJS_NOTIFICATION_SERVICE_PORT,
	hostname: process.env.NODEJS_NOTIFICATION_SERVICE_HOST,
	db: {
		local: 'mongodb://' + (process.env.MONGO_HOST || 'localhost:27017') + ":" + process.env.MONGO_PORT + "/" + process.env.MONGO_DBNAME
	},
	authorization: 'notify@1234',
	mailer: {
		from: process.env.NODEJS_NOTIFICATION_SERVICE_MAILER_FROM,
		options: {
			host: process.env.NODEJS_NOTIFICATION_SERVICE_MAILER_HOST || "smtp.mailtrap.io",
			port: process.env.NODEJS_NOTIFICATION_SERVICE_MAILER_PORT || 25,
			auth: {
				user: process.env.NODEJS_NOTIFICATION_SERVICE_MAILER_EMAIL_ID,
				pass: process.env.NODEJS_NOTIFICATION_SERVICE_MAILER_PASSWORD
			}
		}
	},
	jaeger: {
        host: process.env.JAEGER_HOST || 'localhost',
        port: process.env.JAEGER_PORT || 6832
    },
	fcs: {
		host: process.env.FCS_HOST,
		path: process.env.FCS_PATH,
		AuthorizationKey: process.env.FCS_KEY
	},
	twilio: {
		sid: process.env.TWILIO_SID,
		token: process.env.TWILIO_TOKEN
	},
	apns: {
		
	}
};

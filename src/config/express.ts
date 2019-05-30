'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	express = require('express'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	helmet = require('helmet'),
	config = require('./config'),
	path = require('path'),
	xss = require('xss-clean'),
	webSocket = require('ws'),
	consolidate = require('consolidate'),
	uuid = require('uuid');

var schema = require('../schema/schema').schema;

var logisticsCtrl = require('../app/controllers/logistics.server.controller');
var miscCtrl = require('../app/controllers/misc.server.controller');

// import {schema as schema} from '../schema/schema';

module.exports = function(db) {

	// Initialize express app
	var app = express();

	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;

	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		if(config.app.url){
			app.locals.url = config.app.url + ':' + config.port;
		}else{
			res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		}
		next();
	});

	// Showing stack errors
	app.set('showStackError', true);

	// Set swig as the template engine
	app.engine('server.view.html', consolidate[config.templateEngine]);

	// config
	// app.set("view engine", "pug");
	app.set('view engine', 'server.view.html');
	app.set("views", path.join(__dirname, "../app/views"));

	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		// Enable logger (morgan)
		app.use(morgan('dev'));

		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	} else if (process.env.NODE_ENV === 'alpha') {
		app.locals.cache = 'memory';
	} else if (process.env.NODE_ENV === 'secure') {
		app.use(morgan('dev'));
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded({
		extended: true,
		limit: '50mb'
	}));
	app.use(bodyParser.json());
	app.use(xss());
	app.use(methodOverride());

	// Use helmet to secure Express headers
	//app.use(helmet.frameguard());
	app.use(helmet({
  		frameguard: false
	}));
	app.use(helmet.xssFilter());
	app.use(helmet.noSniff());
	app.use(helmet.ieNoOpen());
	app.disable('x-powered-by');

	app.use(function(req, res, next) {
  	res.header('Access-Control-Allow-Origin', '*');
  	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		res.removeHeader('X-Frame-Options');
	  next();
	});

	app.set('jsonp callback', true);

	// Globbing model files
	config.getGlobbedFiles('./**/models/**/*.js').forEach(function (modelPath) {
		require(path.resolve(modelPath));
	});

	// Globbing routing files
	config.getGlobbedFiles('./**/routes/**/*.js').forEach(function (routePath) {
		require(path.resolve(routePath))(app);
	});

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function(err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		// Log it
		console.error(err.stack);

		console.log('error', 'Internal server error - ' + err.stack, err);

		// Error page
		res.status(500).render('500', {
			error: err.stack
		});
	});

	// Assume 404 since no middleware responded
	app.use(function(req, res) {
		res.status(404).render('404', {
			url: req.originalUrl,
			error: 'Not Found'
		});
	});

	var server;

	if (process.env.NODE_ENV === 'secure') {
		// Log SSL usage
		console.log('Securely using https protocol');

		// Load SSL key and certificate
		var privateKey = fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
		var certificate = fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');

		// Create HTTPS Server
		server = https.createServer({
			key: privateKey,
			cert: certificate
		}, app);

	}else{
		server = http.createServer(app);
	}

	global["wss"] = new webSocket.Server({ port: 4000 });

	global["wss"].broadcast = function broadcast(data) {
		
		if(typeof data!=="string")data=JSON.stringify(data);

		console.log('clients info::', global["wss"].clients);
		global["wss"].clients.forEach(function each(client) {
			console.log('state:', webSocket.OPEN);
			if (client.readyState === webSocket.OPEN) {
				console.log('sending data:',data);
				client.send(data);
			}
		});
	};

	global["wss"].on('connection', function connection(ws) {
		ws.id = uuid.v4();
		ws.on('message', function incoming(message) {
			if(typeof message==="string"){
				message = JSON.parse(message);
			}
			switch(message.context){
				case 'logistics': logisticsCtrl.processSocket(ws,message);break;
				// case 'aviation': aviationCtrl.processSocket(ws,message); break;
				// case 'erp': erpCtrl.processSocket(ws,message); break;
				// case 'hcm': hcmCtrl.processSocket(ws,message); break;
				case 'misc': miscCtrl.processSocket(ws,message); break;
			}
			console.log('received: %s', JSON.stringify(message));
		});
	});

	app.set('server', server);

	// Return Express server instance
	return app;
};

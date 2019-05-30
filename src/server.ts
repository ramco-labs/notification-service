if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

var config = require('./config/config'),
  mongoose = require('mongoose'),
  chalk = require('chalk');

mongoose.Promise = global.Promise;
// Bootstrap db connection
var db = mongoose.connect(config.db.local, {
  // retry to connect for 60 times
  reconnectTries: 60,
  // wait 1 second before retrying
  reconnectInterval: 1000
}, function (err) {
  if (err) {
    console.error(chalk.red('Could not connect to MongoDB!'));
    console.log(chalk.red(err));
  }
});

// Init the express application
var app = require('./config/express')(db);

process.on('uncaughtException', function (err) {
  console.log('Error:', err);
});

// Start the app by listening on <port>
app.get('server').listen(config.port);

// Expose app
exports = module.exports = app;

// Logging initialization
console.log('Server started on ' + config.hostname + ':' + config.port + ' in ' + process.env.NODE_ENV + ' mode');
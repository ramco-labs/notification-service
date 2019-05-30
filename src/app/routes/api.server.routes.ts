'use strict';

var metrics = require('../../app/utils/metrics.utils');

module.exports = function (app) {
  var authCtrl = require('../../app/controllers/auth.server.controller'),
    notificationCtrl = require('../../app/controllers/notifications/notification.server.controller');

  app.route('/api/notification')
    .post(authCtrl.authenticate, notificationCtrl.sendNotification);

  app.route('/api/processqueue')
    .post(authCtrl.authenticate, notificationCtrl.processQueue);

  app.route('/api/platform')
    .post(authCtrl.authenticate, notificationCtrl.register);

  app.route('/api/deregister')
    .post(authCtrl.authenticate, notificationCtrl.deRegister);

  app.route('/api/user/:uid')
    .get(authCtrl.authenticate, notificationCtrl.getUser);

  app.route('/api/registerplatform')
    .post(authCtrl.authenticate, notificationCtrl.registerPlatform);

  app.route('/api/deregisterplatform')
    .post(authCtrl.authenticate, notificationCtrl.deRegisterPlatform);

  app.route('/api/render/call/twiml')
    .post(notificationCtrl.renderTwimlCall);

  app.route('/metrics').get(metrics.getMetrics);


  // Finish with setting up the companyId param
  //app.param('Id', apiCtrl.func);

};

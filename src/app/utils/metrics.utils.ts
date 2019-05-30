var Prometheus = require('prom-client'),
mongoose = require('mongoose');


const metricsInterval = Prometheus.collectDefaultMetrics();

const pushToWebhookCounter = new Prometheus.Counter({
   name: 'pushToWebhookCounter',
   help: 'pushToWebhookCounter',
   labelNames: ['pushToWebhookCounter']
});

const pushToWebhookFailureCounter = new Prometheus.Counter({
   name: 'pushToWebhookFailureCounter',
   help: 'PushToWebhook Failure Counter',
   labelNames: ['pushToWebhookFailureCounter']
});

const emailCount = new Prometheus.Counter({
   name: 'emailCount',
   help: 'Total number of email sent',
   labelNames: ['emailCount']
});

const emailFailureCount = new Prometheus.Counter({
   name: 'emailFailureCount',
   help: 'Total number of email failed',
   labelNames: ['emailFailureCount']
});

const smsCount = new Prometheus.Counter({
   name: 'smsCount',
   help: 'Total number of sms sent',
   labelNames: ['smsCount']
});

const smsFailureCount = new Prometheus.Counter({
   name: 'smsFailureCount',
   help: 'Total number of sms failed',
   labelNames: ['smsFailureCount']
});

const callCount = new Prometheus.Counter({
   name: 'callCount',
   help: 'Total number of calls',
   labelNames: ['callCount']
});

const callFailureCount = new Prometheus.Counter({
   name: 'callFailureCount',
   help: 'Total number of calls failed',
   labelNames: ['callFailureCount']
});

const apnsPushNotificationCount = new Prometheus.Counter({
   name: 'APNSPushNotificationCount',
   help: 'Total number of APNSPushNotification',
   labelNames: ['APNSPushNotification']
});

const apnsPushNotificationFailureCount = new Prometheus.Counter({
   name: 'APNSPushNotificationFailureCount',
   help: 'Total number of APNSPushNotification Failure',
   labelNames: ['APNSPushNotificationFailure']
});

const pushNotificationCount= new Prometheus.Counter({
   name: 'PushNotificationCount',
   help: 'Total number of Push Notifications',
   labelNames: ['PushNotification']
});

const pushNotificationFailureCount = new Prometheus.Counter({
   name: 'PushNotificationFailureCount',
   help: 'Total number of Push Notifications Failures',
   labelNames: ['PushNotificationFailure']
});

const socketCallCount = new Prometheus.Counter({
   name: 'socketCallCount',
   help: 'Total number of Socket Call Count',
   labelNames: ['socketCallCount']
});

const socketCallFailureCount = new Prometheus.Counter({
   name: 'socketCallFailureCount',
   help: 'Total number of Socket Call Failure Count',
   labelNames: ['socketCallFailureCount']
});

const notificationSuccessTotalCount = new Prometheus.Gauge({ name: 'notificationSuccessCount', help: 'Total Number of Notification' });
const notificationPendingCount = new Prometheus.Gauge({ name: 'notificationPendingCount', help: 'Pending Notifications' });
const notificationFailureCount = new Prometheus.Gauge({ name: 'notificationFailureCount', help: 'Total Failure Notifications' });
const notificationTotalCount = new Prometheus.Gauge({ name: 'incomingNotificationCount', help: 'Total Incoming Notifications' });

var notificationSuccessTotalCountFunc=function(totalCount){
   notificationSuccessTotalCount.set(totalCount);
};

var notificationTotalCountFunc=function(totalCount){
    notificationTotalCount.set(totalCount);
};

var notificationPendingCountFunc=function(pendingCount){
   notificationPendingCount.set(pendingCount);
};

var notificationFailureCountFunc=function(failureCount){
    notificationFailureCount.set(failureCount);
};


var initCounters = function(){
   callCount.inc({
       callCount: 'Total call Count'
   },0);

   callFailureCount.inc({
       callFailureCount: 'callFailureCount'
   },0);

   smsCount.inc({
       smsCount: 'Total sms Count'
   },0);
 
   smsFailureCount.inc({
           smsFailureCount: 'smsFailureCount'
   },0);

   emailCount.inc({
       emailCount: 'Total Email Count'
   },0);

   emailFailureCount.inc({
       emailFailureCount: 'emailFailureCount'
   },0);

   socketCallCount.inc({
       socketCallCount: 'socketCallCount'
   },0);

   socketCallFailureCount.inc({
       socketCallFailureCount: 'socketCallFailureCount'
   },0);

   pushNotificationCount.inc({
       PushNotification: 'PushNotificationCount'
   },0);

   pushNotificationFailureCount.inc({
       PushNotificationFailure: 'PushNotificationFailureCount'
   },0);

   pushToWebhookCounter.inc({
       pushToWebhookCounter: 'pushToWebhookCountTotal'
   },0);

   pushToWebhookFailureCounter.inc({
       pushToWebhookFailureCounter: 'pushToWebhookFailureCount'
   },0);

   apnsPushNotificationCount.inc({
       APNSPushNotification: 'APNSPushNotificationCount'
   },0);

   apnsPushNotificationFailureCount.inc({
       APNSPushNotificationFailure: 'APNSPushNotificationFailureCount'
   },0);
 };
initCounters();

exports.socketCallCount = function(){
   socketCallCount.inc({
       socketCallCount: 'socketCallCount'
   });       
};

exports.socketCallFailureCount = function(){
   socketCallFailureCount.inc({
       socketCallFailureCount: 'socketCallFailureCount'
     });
};

exports.pushNotificationCount=function(){
   pushNotificationCount.inc({
       PushNotification: 'PushNotificationCount'
     });       
};

exports.pushNotificationFailureCount=function(){
   pushNotificationFailureCount.inc({
       PushNotificationFailure: 'APNSPushNotificationFailureCount'
   });       
};

exports.apnsPushNotificationCount=function(){
   apnsPushNotificationCount.inc({
       APNSPushNotification: 'APNSPushNotificationCount'
     });       
};

exports.apnsPushNotificationFailureCount=function(){
   apnsPushNotificationFailureCount.inc({
       APNSPushNotificationFailure: 'APNSPushNotificationFailureCount'
     });
};


exports.pushToWebhookCounter=function(){
   pushToWebhookCounter.inc({
       pushToWebhookCounter: 'pushToWebhookCountTotal'
   });
};

exports.pushToWebhookFailureCounter=function(){
   pushToWebhookFailureCounter.inc({
       pushToWebhookFailureCounter: 'pushToWebhookFailureCount'
   });
};


exports.emailCount=function(){
   emailCount.inc({
       emailCount: 'Total Email Count'
     });
};

exports.emailFailureCount=function(){
   emailFailureCount.inc({
       emailFailureCount: 'emailFailureCount'
     });
};

exports.smsCount=function(){
   smsCount.inc({
       smsCount: 'Total sms Count'
     });
};

exports.smsFailureCount=function(){
   smsFailureCount.inc({
       smsFailureCount: 'smsFailureCount'
   });
};

exports.callCount=function(){
   callCount.inc({
       callCount: 'Total call Count'
     });  
};

exports.callFailureCount=function(){
   callFailureCount.inc({
       callFailureCount: 'callFailureCount'
   });
};

var getNotificationQueueSuccessTotal = function(callback){
   var NotificationQueue = mongoose.model('NotificationQueue');
   var query = NotificationQueue.count({sent:{$exists:true}});
   query.exec(function(err, notificationTotal) {
       callback(null,notificationTotal);
   });
};

var getNotificationQueueTotal = function(callback){
    var NotificationQueue = mongoose.model('NotificationQueue');
    var query = NotificationQueue.count({});
    query.exec(function(err, notificationTotal) {
        callback(null,notificationTotal);
    });
 };

var getPendingTotal = function(callback){
   var NotificationQueue = mongoose.model('NotificationQueue');
   var query = NotificationQueue.count({sent:{$exists:false},retryCount:0});
   query.exec(function(err, notificationPendingTotal) {
       callback(null,notificationPendingTotal);
   });
};

var getFailureNotificationCount = function(callback){
    var NotificationQueue = mongoose.model('NotificationQueue');
   var query = NotificationQueue.count({retryCount:5}); 
   query.exec(function(err, notificationFailures) {
        callback(notificationFailures);
    });
 };


exports.getMetrics = function(req,res){
   getPendingTotal(function(err,pendingCount){
       notificationPendingCountFunc(pendingCount);	
       getNotificationQueueSuccessTotal(function(err,totalCount){
           notificationTotalCountFunc(totalCount);
           getFailureNotificationCount(function(notificationFailureCount){
                notificationFailureCountFunc(notificationFailureCount);
                getNotificationQueueTotal(function(err,total){
                    notificationTotalCountFunc(total); 
                    res.set('Content-Type', Prometheus.register.contentType);
                    res.end(Prometheus.register.metrics());
                });
           });           
       });
   });
  
};








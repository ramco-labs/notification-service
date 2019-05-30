'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var NotificationSchema = new Schema({
    provider: { type: String, required: true },
    providerData: { type: Object }
});

mongoose.model('Notification', NotificationSchema);

var NotificationQueueSchema = new Schema({
    metaData: { type: Schema.Types.Mixed },
    notificationType: { type: String },
    created: {
        type: Date,
        default: Date.now
    },
    scheduled: { type: Date },
    recurrence: [{ type: String }],
    sent: { type: Date },
    retryCount: { type: Number }
});

mongoose.model('NotificationQueue', NotificationQueueSchema);

var PlatformSchema = new mongoose.Schema({
    type: 'String',
    version: 'String',
    platformid: {
        type: 'String',
        unique: true,
        required: true,
        sparse: true
    },
    platformContext: { type: Schema.Types.Mixed },
    status: 'String',
    created: {
        type: Date,
        default: Date.now
    }
});

mongoose.model('Platform', PlatformSchema);

var RegistrationSchema = new Schema({
    uid: { type: String },
    context: { type: Schema.Types.Mixed },
    created: {
        type: Date,
        default: Date.now
    },
    platforms: [PlatformSchema],
    status: 'String'
});

mongoose.model('Registration', RegistrationSchema);
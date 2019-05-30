'use strict';

exports.processSocket = function (ws, message) {
    switch (message.event) {
        case 'notification:new': ws.send('received misc message'); break;
    }
};

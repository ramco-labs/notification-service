'use strict';

/**
 * Module dependencies.
 */
var config = require('../../config/config');
var axios = require('axios');

exports.getIntent = function(text,callback){
    var userInput = encodeURI(text);
    var options = {
        url: "https://api.wit.ai/message?q=" + userInput,
        headers: {
            'Accept': 'application/json;charset=UTF-8',
            'Authorization': 'Bearer '+config.ai.wit.accessToken
        },
        responseType: 'json'
    };

    var intentResponse={
        intent: 'Unknown',
        entity: {}
    };
    axios(options).then(function (response) {
        var body = response.data;

        if(body.entities.number){
            for (var i = 0; i < body.entities.number.length; i++) {
                if (body.entities.number[i].confidence >= 0.8) {
                    intentResponse.entity["number"] = body.entities.number[i].value;
                    break;
                }
            }
        }

        if(body.entities.intent){
            for (var i = 0; i < body.entities.intent.length; i++) {
                if (body.entities.intent[i].confidence >= 0.8) {
                    intentResponse.intent = body.entities.intent[i].value;
                    break;
                }
            }
        }

        return callback(null, intentResponse);
    }).catch(function(error){
        console.log('error occured:',error);
        return callback(error, {});
    });
};
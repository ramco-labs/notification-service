const axios = require('axios');
import { log } from '../utils/error.utils';
const { FORMAT_HTTP_HEADERS } = require('opentracing');

export const apiCall = async function (url, payload, auth, span) {
    
    let apiCallSpan = global[ "tracer" ].startSpan("api-call", { childOf: span });
    
    try {

        let headers = {
            Accept: 'application/json;charset=UTF-8',
            authorization: auth
        };

        global[ "tracer" ].inject(apiCallSpan, FORMAT_HTTP_HEADERS, headers);

        log("info", {
            msg: "Routing",
            url: url,
            payload: payload
        });

        let apiOptions = {
            url: url,
            method: 'POST',
            headers: headers,
            responseType: 'json',
            data: payload
        };

        let response = await axios(apiOptions);

        apiCallSpan.finish();

        return { 
            err: null,
            response: response.data,
            span: apiCallSpan
        };
    } catch (err) {

        log("error", {
            message: "Error in routing url",
            url: url,
            err: err.response
        }, apiCallSpan);

        apiCallSpan.finish();

        return {
            err: err,
            response: null,
            span: apiCallSpan
        };
    }
};
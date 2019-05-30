const { Tags } = require('opentracing');

/**
 * @param serviceName
 */
export const log = function (level, payload, span=undefined, tag=undefined) {

    switch (level) {
        case 'error':
            if (span) {
                span.setTag(Tags.ERROR, true);
            }
            console.error(payload);
        break;

        case 'info':
            if (span && tag) {
                span.setTag('tag', tag);
            }
            console.info(payload);
        break;

        default:
            console.log(JSON.stringify(payload));
    }

    if (span) {
        span.log(payload);
    }
};
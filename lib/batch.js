// Load modules

var Url = require('url');
var Async = require('async');
var Boom = require('boom');
var JSONPath = require('JSONPath');
var Traverse = require('traverse');
var Hoek = require('hoek');

// Declare internals

var internals = {};

module.exports.config = function (settings) {

    return {
        handler: function (request, reply) {

            var resultsData = {
                results: [],
                resultsMap: []
            };

            var requests = [];
            var requestRegex = /(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g;       // /project/$1.project/tasks, does not allow using array responses

            var payloads = [];
            var payloadRegex = /^\$\.\./;

            // Validate requests

            var errorMessage = null;
            var parseRequest = function ($0, $1, $2) {

                if ($1) {
                    if ($1 < i) {
                        requestParts.push({ type: 'ref', index: $1, value: $2 });
                        return '';
                    }

                    errorMessage = 'Request reference is beyond array size: ' + i;
                    return $0;
                }

                requestParts.push({ type: 'text', value: $2 });
                return '';
            };

            if (!request.payload.requests) {
                return reply(Boom.badRequest('Request missing requests array'));
            }

            for (var i = 0, il = request.payload.requests.length; i < il; ++i) {

                // Break into parts

                var requestParts = [];
                var result = request.payload.requests[i].path.replace(requestRegex, parseRequest);

                // Make sure entire string was processed (empty)

                if (result === '') {
                    requests.push(requestParts);
                }
                else {
                    errorMessage = errorMessage || 'Invalid request format in item: ' + i;
                    break;
                }

                var payload = request.payload.requests[i].payload;
                var payloadParts = internals.parsePayload(payloadRegex, payload);

                payloads.push(payloadParts || []);
            }

            if (errorMessage === null) {
                internals.process(request, requests, payloads, resultsData, reply);
            }
            else {
                reply(Boom.badRequest(errorMessage));
            }
        },
        description: settings.description,
        auth: settings.auth,
        tags: settings.tags
    };
};

internals.process = function (request, requests, payloads, resultsData, reply) {

    var fnsParallel = [];
    var fnsSerial = [];

    var callBatch = function (pos, batchParts, batchParts) {

        return function (callback) {

            internals.batch(request, resultsData, pos, requestParts, payloadParts, callback);
        };
    };

    for (var i = 0, il = requests.length; i < il; ++i) {
        var requestParts = requests[i];
        var payloadParts = payloads[i];

        if (internals.hasRefPart(requestParts) || payloadParts.length) {
            fnsSerial.push(callBatch(i, requestParts, payloadParts));
        }
        else {
            fnsParallel.push(callBatch(i, requestParts));
        }
    }

    Async.series([
        function (callback) {

            Async.parallel(fnsParallel, callback);
        },
        function (callback) {

            Async.series(fnsSerial, callback);
        }
    ], function (err) {

        if (err) {
            reply(err);
        }
        else {
            reply(resultsData.results);
        }
    });
};


internals.hasRefPart = function (parts) {

    for (var i = 0, il = parts.length; i < il; ++i) {
        if (parts[i].type === 'ref') {
            return true;
        }
    }

    return false;
};

internals.buildPath = function(resultsData, pos, parts) {

    var path = '';

    for (var i = 0, il = parts.length; i < il; ++i) {
        path += '/';

        if (parts[i].type === 'ref') {
            var ref = resultsData.resultsMap[parts[i].index];

            if (ref) {
                var value = Hoek.reach(ref, parts[i].value);

                if (value !== null && value !== undefined) {

                    if (/^[\w:]+$/.test(value)) {
                        path += value;
                    }
                    else {
                        throw new Error('Reference value includes illegal characters');
                    }
                }
                else {
                    throw new Error('Reference not found');
                }
            }
            else {
                throw new Error('Missing reference response');
            }
        }
        else {
            path += parts[i].value;
        }
    }

    return path;
};

internals.parsePayload = function (re, obj) {

    var payloadParts = [];

    if (!obj) {
        return null;
    }

    Traverse(obj).forEach(function (value) {

        if (typeof value === 'string') {
            if (re.test(value)) {
                payloadParts.push({
                    path: this.path,
                    value: value
                });
            }
        }
    });

    return payloadParts;
};

internals.buildPayload = function(payload, resultsData, parts) {

    for (var i = 0, il = parts.length; i < il; ++i) {
        var data = JSONPath.eval(resultsData.resultsMap, parts[i].value);
        if (parts[i].path.length) {
            Traverse(payload).set(parts[i].path, data[0]);
        } else {
            payload = data[0];
        }
    }

    return payload;
};

internals.batch = function (batchRequest, resultsData, pos, requestParts, payloadParts, callback) {

    var path = '';
    try {
        path = internals.buildPath(resultsData, pos, requestParts);
    } catch(error) {
        resultsData.results[pos] = error;
        return callback(error);
    }

    // Make request
    batchRequest.payload.requests[pos].path = path;

    if (payloadParts && payloadParts.length) {
        var payload = internals.buildPayload(
                batchRequest.payload.requests[pos].payload,
                resultsData,
                payloadParts
                );

        // Make payload
        batchRequest.payload.requests[pos].payload = payload;
    }

    internals.dispatch(batchRequest, batchRequest.payload.requests[pos], function (data) {

        // If redirection
        if (('' + data.statusCode).indexOf('3') === 0) {
            batchRequest.payload.requests[pos].path = data.headers.location;
            internals.dispatch(batchRequest, batchRequest.payload.requests[pos], function (batchData) {

                var batchResult = batchData.result;

                resultsData.results[pos] = batchResult;
                resultsData.resultsMap[pos] = batchResult;
                callback(null, batchResult);
            });
            return;
        }

        var result = data.result;
        resultsData.results[pos] = result;
        resultsData.resultsMap[pos] = result;
        callback(null, result);
    });
};


internals.dispatch = function (batchRequest, request, callback) {

    var path = request.path;

    if (request.query) {
        var urlObject = {
            pathname: request.path,
            query: request.query
        };
        path = Url.format(urlObject);
    }

    var body = (request.payload !== null && request.payload !== undefined ? JSON.stringify(request.payload) : null);     // payload can be '' or 0
    var injectOptions = {
        url: path,
        method: request.method,
        headers: batchRequest.headers,
        payload: body,
        session: batchRequest.session
    };

    batchRequest.server.inject(injectOptions, callback);
};

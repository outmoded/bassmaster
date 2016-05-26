'use strict';

// Load modules

const Url = require('url');
const Async = require('async');
const Boom = require('boom');
const Traverse = require('traverse');
const Hoek = require('hoek');
const Joi = require('joi');

// Declare internals

const internals = {};

module.exports.config = function (settings) {

    return {
        handler: function (request, reply) {

            const resultsData = {
                results: [],
                resultsMap: []
            };

            const requests = [];
            const requestRegex = /(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g;       // /project/$1.project/tasks, does not allow using array responses

            const payloads = [];
            const payloadRegex = /^\$(\d+)(?:\.([^\s\$]*))?/;

            // Validate requests

            let errorMessage = null;
            let i = 0;
            let requestParts;
            let result;

            const il = request.payload.requests.length;

            const parseRequest = function ($0, $1, $2) {

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

            for ( ; i < il; ++i) {

                // Break into parts

                requestParts = [];
                result = request.payload.requests[i].path.replace(requestRegex, parseRequest);

                // Make sure entire string was processed (empty)

                if (result === '') {
                    requests.push(requestParts);
                }
                else {
                    errorMessage = errorMessage || 'Invalid request format in item: ' + i;
                    break;
                }

                const payload = request.payload.requests[i].payload;
                const payloadParts = internals.parsePayload(payloadRegex, payload);

                payloads.push(payloadParts || []);
            }

            if (errorMessage === null) {
                internals.process(request, requests, payloads, resultsData, reply);
            }
            else {
                reply(Boom.badRequest(errorMessage));
            }
        },
        notes: settings.notes,
        description: settings.description,
        validate: {
            payload: Joi.object({
                requests: Joi.array().items(Joi.object({
                    method: Joi.string().required(),
                    path: Joi.string().required(),
                    query: [Joi.object().unknown().allow(null),Joi.string()],
                    payload: [Joi.object().unknown().allow(null),Joi.string()]
                }).label('BatchRequest')).min(1).required()
            }).required().label('BatchRequestPayload')
        },
        auth: settings.auth,
        tags: settings.tags
    };
};

internals.process = function (request, requests, payloads, resultsData, reply) {

    const fnsParallel = [];
    const fnsSerial = [];

    const callBatch = function (pos, requestParts, payloadParts) {

        return (callback) => {

            internals.batch(request, resultsData, pos, requestParts, payloadParts, callback);
        };
    };

    let i = 0;
    const il = requests.length;

    for ( ; i < il; ++i) {
        const requestParts = requests[i];
        const payloadParts = payloads[i];

        if (internals.hasRefPart(requestParts) || payloadParts.length) {
            fnsSerial.push(callBatch(i, requestParts, payloadParts));
        }
        else {
            fnsParallel.push(callBatch(i, requestParts));
        }
    }

    Async.series([
        (callback) => {

            Async.parallel(fnsParallel, callback);
        },
        (callback) => {

            Async.series(fnsSerial, callback);
        }
    ], (err) => {

        if (err) {
            reply(err);
        }
        else {
            reply(resultsData.results);
        }
    });
};


internals.hasRefPart = function (parts) {

    let i = 0;
    const il = parts.length;
    for ( ; i < il; ++i) {
        if (parts[i].type === 'ref') {
            return true;
        }
    }

    return false;
};

internals.buildPath = function (resultsData, pos, parts) {

    let path = '';
    let error = null;
    let i = 0;
    const il = parts.length;

    for ( ; i < il; ++i) {
        path += '/';

        if (parts[i].type === 'ref') {
            const ref = resultsData.resultsMap[parts[i].index];

            if (ref) {
                const value = Hoek.reach(ref, parts[i].value);

                if (value !== null && value !== undefined) {

                    if (/^[\w:]+$/.test(value)) {
                        path += value;
                    }
                    else {
                        error = new Error('Reference value includes illegal characters');
                        break;
                    }
                }
                else {
                    error = new Error('Reference not found');
                    break;
                }
            }
            else {
                error = new Error('Missing reference response');
                break;
            }
        }
        else {
            path += parts[i].value;
        }
    }

    return error ? error : path;
};

internals.parsePayload = function (re, obj) {

    const payloadParts = [];

    if (!obj) {
        return null;
    }

    Traverse(obj).forEach(function (value) {

        if (typeof value === 'string') {
            const match = value.match(re);
            if (match) {
                payloadParts.push({
                    path: this.path,
                    resultIndex: match[1],
                    resultPath: match[2]
                });
            }
        }
    });

    return payloadParts;
};

internals.evalResults = function (results, index, path) {

    let result = results[index];

    if (path) {
        result = Hoek.reach(result, path) || {};
    }

    return result;
};

internals.buildPayload = function (payload, resultsData, parts) {

    let i = 0;
    const il = parts.length;
    for ( ; i < il; ++i) {

        const result = internals.evalResults(resultsData.resultsMap, parts[i].resultIndex, parts[i].resultPath);

        if (parts[i].path.length) {
            Traverse(payload).set(parts[i].path, result);
        }
        else {
            payload = result;
        }
    }

    return payload;
};

internals.batch = function (batchRequest, resultsData, pos, requestParts, payloadParts, callback) {

    const path = internals.buildPath(resultsData, pos, requestParts);

    if (path instanceof Error) {
        resultsData.results[pos] = path;
        return callback(path);
    }

    // Make request
    batchRequest.payload.requests[pos].path = path;

    if (payloadParts && payloadParts.length) {
        const payload = internals.buildPayload(
            batchRequest.payload.requests[pos].payload,
            resultsData,
            payloadParts
        );

        // Make payload
        batchRequest.payload.requests[pos].payload = payload;
    }

    internals.dispatch(batchRequest, batchRequest.payload.requests[pos], (data) => {

        // If redirection
        if (('' + data.statusCode).indexOf('3') === 0) {
            batchRequest.payload.requests[pos].path = data.headers.location;
            internals.dispatch(batchRequest, batchRequest.payload.requests[pos], (batchData) => {

                const batchResult = batchData.result;

                resultsData.results[pos] = batchResult;
                resultsData.resultsMap[pos] = batchResult;
                callback(null, batchResult);
            });
            return;
        }

        const result = data.result;
        resultsData.results[pos] = result;
        resultsData.resultsMap[pos] = result;
        callback(null, result);
    });
};


internals.dispatch = function (batchRequest, request, callback) {

    let path = request.path;

    if (request.query) {
        const urlObject = {
            pathname: request.path,
            query: request.query
        };
        path = Url.format(urlObject);
    }

    const body = (request.payload !== null && request.payload !== undefined ? JSON.stringify(request.payload) : null);     // payload can be '' or 0
    const injectOptions = {
        url: path,
        method: request.method,
        headers: batchRequest.headers,
        payload: body,
        session: batchRequest.session
    };
    if (batchRequest.server.connections.length === 1) {
        batchRequest.server.inject(injectOptions, callback);
    }
    else {
        batchRequest.connection.inject(injectOptions, callback);
    }
};

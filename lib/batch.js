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

            const requests = [];
            const payloads = [];
            const resultsData = {
                results: [],
                resultsMap: []
            };

            let errorMessage = null;

            request.payload.requests.every((req, idx) => {

                const requestParts = [];
                const result = req.path.replace(internals.requestRegex, (match, p1, p2) => {

                    if (!p1) {
                        requestParts.push({ type: 'text', value: p2 });
                        return '';
                    }

                    if (p1 < idx) {
                        requestParts.push({ type: 'ref', index: p1, value: p2 });
                        return '';
                    }

                    errorMessage = 'Request reference is beyond array size: ' + idx;
                    return match;
                });

                // Make sure entire string was processed (empty)

                if (result === '') {
                    requests.push(requestParts);
                }
                else {
                    errorMessage = errorMessage || 'Invalid request format in item: ' + idx;
                    return false;
                }

                const payloadParts = internals.parsePayload(req.payload);

                payloads.push(payloadParts || []);
                return true;
            });

            if (errorMessage !== null) {
                return reply(Boom.badRequest(errorMessage));
            }

            internals.process(request, requests, payloads, resultsData, reply);
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

    requests.forEach((requestParts, idx) => {

        const payloadParts = payloads[idx];
        if (internals.hasRefPart(requestParts) || payloadParts.length) {
            return fnsSerial.push((callback) => {

                internals.batch(request, resultsData, idx, requestParts, payloadParts, callback);
            });
        }

        fnsParallel.push((callback) => {

            internals.batch(request, resultsData, idx, requestParts, undefined, callback);
        });
    });

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

    return parts.some((part) => part.type === 'ref');
};

internals.buildPath = function (resultsData, pos, parts) {

    let path = '';
    let error = null;
    let ref;
    let value;
    let part;
    const partsLength = parts.length;

    for (let i = 0; i < partsLength; ++i) {
        path += '/';
        part = parts[i];

        if (part.type !== 'ref') {
            path += part.value;
            continue;
        }

        ref = resultsData.resultsMap[part.index];

        if (!ref) {
            error = new Error('Missing reference response');
            break;
        }

        value = Hoek.reach(ref, part.value);

        if (value === null || value === undefined) {
            error = new Error('Reference not found');
            break;
        }

        if (!/^[\w:]+$/.test(value)) {
            error = new Error('Reference value includes illegal characters');
            break;
        }

        path += value;

    }

    return error ? error : path;
};

internals.payloadRegex = /^\$(\d+)(?:\.([^\s\$]*))?/;

internals.requestRegex = /(?:\/)(?:\$(\d)+\.)?([^\/\$]*)/g;

internals.parsePayload = function (obj) {

    const payloadParts = [];

    if (!obj) {
        return null;
    }

    Traverse(obj).forEach(function (value) {

        if (typeof value !== 'string') {
            return;
        }

        const match = internals.payloadRegex.exec(value);

        if (!match) {
            return;
        }

        payloadParts.push({
            path: this.path,
            resultIndex: match[1],
            resultPath: match[2]
        });
    });

    return payloadParts;
};

internals.evalResults = function (results, index, path) {

    const result = results[index];

    if (!path) {
        return result;
    }

    return Hoek.reach(result, path) || {};
};

internals.buildPayload = function (payload, resultsData, parts) {

    const partsLength = parts.length;
    let result;
    let part;
    for ( let i = 0; i < partsLength; ++i) {

        part = parts[i];
        result = internals.evalResults(resultsData.resultsMap, part.resultIndex, part.resultPath);

        if (!part.path.length) {
            payload = result;
        }
        else {
            Traverse(payload).set(part.path, result);
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
    const request = batchRequest.payload.requests[pos];

    request.path = path;

    if (payloadParts && payloadParts.length) {

        // Make payload
        request.payload = internals.buildPayload(
            request.payload,
            resultsData,
            payloadParts
        );
    }

    internals.dispatch(batchRequest, request, (data) => {

        // If redirection
        if (('' + data.statusCode).indexOf('3') === 0) {
            request.path = data.headers.location;
            internals.dispatch(batchRequest, request, (batchData) => {

                const batchResult = internals.parseResult(batchData.result);

                resultsData.results[pos] = batchResult;
                resultsData.resultsMap[pos] = batchResult;
                callback(null, batchResult);
            });
            return;
        }

        const result = internals.parseResult(data.result);
        resultsData.results[pos] = result;
        resultsData.resultsMap[pos] = result;
        callback(null, result);
    });
};

internals.parseResult = function (result){

    if (typeof (result) === 'string'){
        try {
            return JSON.parse(result);
        }
        catch (e) {
            return result;
        }
    }
    else {
        return result;
    }
};

internals.dispatch = function (batchRequest, request, callback) {

    let path;

    if (request.query) {
        path = Url.format({
            pathname: request.path,
            query: request.query
        });
    }
    else {
        path = request.path;
    }

    const body = (request.payload !== null && request.payload !== undefined ? JSON.stringify(request.payload) : null);
    const injectOptions = {
        url: path,
        method: request.method,
        headers: batchRequest.headers,
        payload: body
    };
    if (batchRequest.server.connections.length === 1) {
        batchRequest.server.inject(injectOptions, callback);
    }
    else {
        batchRequest.connection.inject(injectOptions, callback);
    }
};

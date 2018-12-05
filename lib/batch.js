'use strict';

// Load modules

const Url = require('url');
const Async = require('async');
const Boom = require('boom');
const Traverse = require('traverse');
const Hoek = require('hoek');
const Joi = require('joi');
const { promisify } = require('util');

const asyncSeries = promisify(Async.series);
const asyncParallel = promisify(Async.parallel);

// Declare internals

const internals = {};

module.exports.config = function (settings) {

    return {
        handler: async function (request, h) {

            const requests = [];
            const parsables = {
                payloads: [],
                queries: []
            };
            const resultsData = {
                results: [],
                resultsMap: []
            };

            let errorMessage = null;

            request.payload.requests.every((req, idx) => {

                const requestParts = [];
                const result = req.path.replace(internals.requestRegex, (match, p1, p2, p3) => {

                    if (!p1) {
                        requestParts.push({ type: 'text', value: p3 });
                        return '';
                    }

                    if (p1 < idx) {
                        requestParts.push({ type: 'ref', index: p1, value: p3 });
                        return '';
                    }

                    errorMessage = `Request reference is beyond array size: ${idx}`;
                    return match;
                });

                // Make sure entire string was processed (empty)

                if (result === '') {
                    requests.push(requestParts);
                }
                else {
                    errorMessage = errorMessage || `Invalid request format in item: ${idx}`;
                    return false;
                }

                const queryParts = internals.parse(req.query);
                const payloadParts = internals.parse(req.payload);

                parsables.queries.push(queryParts || []);
                parsables.payloads.push(payloadParts || []);
                return true;
            });

            if (errorMessage !== null) {
                throw Boom.badRequest(errorMessage);
            }

            try {
                await internals.process(request, requests, parsables, resultsData);
            }
            catch (err) {
                // console.log("ERROR ", err);
                throw Boom.badRequest(err);
            }

            return h.response(resultsData.results).code(200);
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

internals.process = async function (request, requests, parsables, resultsData) {

    const fnsParallel = [];
    const fnsSerial = [];

    requests.forEach((requestParts, idx) => {

        const parsableParts = {
            payloadParts: parsables.payloads[idx],
            queryParts: parsables.queries[idx]
        };
        if (internals.hasRefPart(requestParts)
        || parsableParts.payloadParts.length
        || parsableParts.queryParts.length) {
            return fnsSerial.push(
                async () => await internals.batch(request, resultsData, idx, requestParts, parsableParts)
            );
        }

        fnsParallel.push(
            async () => await internals.batch(request, resultsData, idx, requestParts)
        );
    });


    return await asyncSeries([
        async () => await asyncParallel(fnsParallel),
        async () => await asyncSeries(fnsSerial)
    ]);
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

        value = part.value ? Hoek.reach(ref, part.value) : ref;

        if (value === null || value === undefined) {
            error = new Error('Reference not found');
            break;
        }

        if (!/^[\w\d-\.]+$/.test(value)) {
            error = new Error('Reference value includes illegal characters');
            break;
        }

        path += value;

    }

    return error ? error : path;
};

internals.pipelinableParsableRegex = /^\$(\d+)(?:\.([^\s\$]*))?/;

internals.requestRegex = /(?:\/)(?:\$(\d+))?(\.)?([^\/\$]*)/g;

internals.parse = function (obj) {

    const parsableParts = [];

    if (!obj) {
        return null;
    }

    Traverse(obj).forEach(function (value) {

        if (typeof value !== 'string') {
            return;
        }

        const match = internals.pipelinableParsableRegex.exec(value);

        if (!match) {
            return;
        }

        parsableParts.push({
            path: this.path,
            resultIndex: match[1],
            resultPath: match[2]
        });
    });

    return parsableParts;
};

internals.evalResults = function (results, index, path) {

    const result = results[index];

    if (!path) {
        return result;
    }

    const evalResults = Hoek.reach(result, path);

    return evalResults || evalResults === 0 || evalResults === false ? evalResults : {};
};

internals.buildParsable = function (parsable, resultsData, parts) {

    const partsLength = parts.length;
    let result;
    let part;
    for ( let i = 0; i < partsLength; ++i) {

        part = parts[i];
        result = internals.evalResults(resultsData.resultsMap, part.resultIndex, part.resultPath);

        if (!part.path.length) {
            parsable = result;
        }
        else {
            Traverse(parsable).set(part.path, result);
        }
    }

    return parsable;
};

internals.batch = async function (batchRequest, resultsData, pos, requestParts, parsableParts = {}) {

    const path = internals.buildPath(resultsData, pos, requestParts);

    if (path instanceof Error) {
        resultsData.results[pos] = path;
        throw path;
    }

    // Make request
    const request = batchRequest.payload.requests[pos];

    request.path = path;

    if (parsableParts.payloadParts && parsableParts.payloadParts.length) {

        // Make payload
        request.payload = internals.buildParsable(
            request.payload,
            resultsData,
            parsableParts.payloadParts
        );
    }

    if (parsableParts.queryParts && parsableParts.queryParts.length) {

        // Make queryParts
        request.query = internals.buildParsable(
            request.query,
            resultsData,
            parsableParts.queryParts
        );
    }

    let data = await internals.dispatch(batchRequest, request);

    // If redirection
    if (data.statusCode >= 300 && data.statusCode < 400) {
        request.path = data.headers.location;
        data = await internals.dispatch(batchRequest, request);
    }

    const result = internals.parseResult(data.result);
    resultsData.results[pos] = result;
    resultsData.resultsMap[pos] = result;
    return result;
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

internals.dispatch = async function (batchRequest, request) {

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
        credentials: batchRequest.auth.credentials,
        headers: batchRequest.headers,
        payload: body
    };

    return await batchRequest.server.inject(injectOptions);
};

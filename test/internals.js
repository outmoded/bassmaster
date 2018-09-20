'use strict';

const Hapi = require('hapi');
const Bassmaster = require('../');

const profileHandler = function (request, h) {

    const id = request.query.id || 'fa0dbda9b1b';

    return h.response({
        id,
        'name': 'John Doe'
    });
};

const activeItemHandler = function (request, h) {

    return h.response({
        'id': '55cf687663',
        'name': 'Active Item'
    });
};

const itemHandler = function (request, h) {

    return h.response({
        'id': request.params.id,
        'name': 'Item'
    });
};

const deepItemHandler = function (request, h) {

    return h.response({
        'id': '55cf687663',
        'name': 'Deep Item',
        'inner': {
            'name': 'Level 1',
            'inner': {
                'name': 'Level 2',
                'inner': {
                    'name': 'Level 3',
                    'array': [
                        {
                            'name': 'Array Item 0'
                        },
                        {
                            'name': 'Array Item 1'
                        }
                    ]
                }
            }
        }
    });
};

const item2Handler = function (request, h) {

    return h.response({
        'id': request.params.id || 'mystery-guest',
        'name': 'Item'
    });
};

const arrayHandler = function (request, h) {

    return h.response({
        'id': '55cf687663',
        'name': 'Dress',
        'items': [{ 'color': 'blackandblue' }, { 'color': 'whiteandgold' }]
    });
};

const zeroIntegerHandler = function (request, h) {

    return h.response({
        'id': 0,
        'name': 'Zero Item'
    });
};

const integerHandler = function (request, h) {

    return h.response({
        'id': 123,
        'name': 'Integer Item'
    });
};

const integerItemHandler = function (request, h) {

    return h.response({
        'id': request.params.id,
        'name': 'Integer'
    });
};

const stringItemHandler = function (request, h) {

    return h.response('{' +
        '"id": "55cf687663",' +
        '"name": "String Item"' +
    '}');
};

const badCharHandler = function (request, h) {

    return h.response({
        'id': 'test',
        'null': null,
        'invalidChar': '#'
    });
};

const badValueHandler = function (request, h) {

    return h.response(null);
};

const redirectHandler = function (request, h) {

    return h.redirect('/profile');
};

const interestingIdsHandler = function (request, h) {

    return h.response({
        'idWithDash': '55cf-687663-55cf687663',
        'idLikeFilename': '55cf687663.png',
        'idLikeFileNameWithDash': '55cf-687663-55cf687663.png'
    });
};

const fetch1 = function (request, h) {

    return 'Hello';
};

const fetch2 = function (request, h) {

    return request.pre.m1 + request.pre.m3 + request.pre.m4;
};

const fetch3 = function (request, h) {

    return ' ';
};

const fetch4 = function (request, h) {

    return 'World';
};

const fetch5 = function (request, h) {

    return `${request.pre.m2}!`;
};

const getFetch = function (request, h) {

    return `${request.pre.m5}\n`;
};

const errorHandler = function (request, h) {

    return new Error('myerror');
};

const echoHandler = function (request, h) {

    return request.payload;
};

const returnInputtedIntegerHandler = function (request, h) {

    return request.payload.id;
};

const getFalseHandler = function (request, h) {

    return false;
};

const returnInputtedBooleanHandler = function (request, h) {

    return request.payload.bool;
};

const returnPathParamHandler = function (request, h) {

    return request.params.pathParamInteger;
};

const returnInputtedStringHandler = function (request, h) {

    return {
        id: request.params.id,
        paramString: request.params.paramString,
        queryString: request.query.queryString,
        payloadString: request.payload.payloadString
    };
};

module.exports.setupServer = async function () {

    const server = new Hapi.Server();
    server.route([
        { method: 'POST', path: '/echo', handler: echoHandler },
        { method: 'PUT', path: '/echo', handler: echoHandler },
        { method: 'GET', path: '/profile', handler: profileHandler },
        { method: 'GET', path: '/item', handler: activeItemHandler },
        { method: 'GET', path: '/deepItem', handler: deepItemHandler },
        { method: 'GET', path: '/array', handler: arrayHandler },
        { method: 'GET', path: '/item/{id}', handler: itemHandler },
        { method: 'GET', path: '/item2/{id?}', handler: item2Handler },
        { method: 'GET', path: '/zero', handler: zeroIntegerHandler },
        { method: 'GET', path: '/int', handler: integerHandler },
        { method: 'GET', path: '/int/{id}', handler: integerItemHandler },
        { method: 'GET', path: '/string', handler: stringItemHandler },
        { method: 'GET', path: '/interestingIds', handler: interestingIdsHandler },
        { method: 'GET', path: '/error', handler: errorHandler },
        { method: 'GET', path: '/badchar', handler: badCharHandler },
        { method: 'GET', path: '/badvalue', handler: badValueHandler },
        {
            method: 'GET',
            path: '/fetch',
            handler: getFetch,
            config: {
                pre: [
                    { method: fetch1, assign: 'm1', mode: 'parallel' },
                    { method: fetch2, assign: 'm2' },
                    { method: fetch3, assign: 'm3', mode: 'parallel' },
                    { method: fetch4, assign: 'm4', mode: 'parallel' },
                    { method: fetch5, assign: 'm5' }
                ]
            }
        },
        { method: 'GET', path: '/redirect', handler: redirectHandler },
        { method: 'POST', path: '/returnInputtedInteger', handler: returnInputtedIntegerHandler },
        { method: 'GET', path: '/returnPathParamInteger/{pathParamInteger}', handler: returnPathParamHandler },
        { method: 'GET', path: '/getFalse', handler: getFalseHandler },
        { method: 'POST', path: '/returnInputtedBoolean', handler: returnInputtedBooleanHandler },
        { method: 'POST', path: '/returnInputtedString/{id}/{paramString}', handler: returnInputtedStringHandler }
    ]);

    await server.register(Bassmaster);

    return server;
};

module.exports.makeRequest = async function (server, payload) {

    return (await server.inject({
        method: 'post',
        url: '/batch',
        payload
    })).result;
};

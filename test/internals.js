'use strict';

const Hapi = require('hapi');
const Bassmaster = require('../');

const profileHandler = function (request, reply) {

    const id = request.query.id || 'fa0dbda9b1b';

    return reply({
        'id': id,
        'name': 'John Doe'
    });
};

const activeItemHandler = function (request, reply) {

    return reply({
        'id': '55cf687663',
        'name': 'Active Item'
    });
};

const itemHandler = function (request, reply) {

    return reply({
        'id': request.params.id,
        'name': 'Item'
    });
};

const item2Handler = function (request, reply) {

    return reply({
        'id': request.params.id || 'mystery-guest',
        'name': 'Item'
    });
};

const arrayHandler = function (request, reply) {

    return reply({
        'id': '55cf687663',
        'name': 'Dress',
        'items': [{ 'color': 'blackandblue' }, { 'color': 'whiteandgold' }]
    });
};

const zeroIntegerHandler = function (request, reply) {

    return reply({
        'id': 0,
        'name': 'Zero Item'
    });
};

const integerHandler = function (request, reply) {

    return reply({
        'id': 123,
        'name': 'Integer Item'
    });
};

const integerItemHandler = function (request, reply) {

    return reply({
        'id': request.params.id,
        'name': 'Integer'
    });
};

const badCharHandler = function (request, reply) {

    return reply({
        'id': 'test',
        'null': null,
        'invalidChar': '#'
    });
};

const badValueHandler = function (request, reply) {

    return reply(null);
};

const redirectHandler = function (request, reply) {

    return reply().redirect('/profile');
};

const fetch1 = function (request, next) {

    next('Hello');
};

const fetch2 = function (request, next) {

    next(request.pre.m1 + request.pre.m3 + request.pre.m4);
};

const fetch3 = function (request, next) {

    process.nextTick(() => {

        next(' ');
    });
};

const fetch4 = function (request, next) {

    next('World');
};

const fetch5 = function (request, next) {

    next(request.pre.m2 + '!');
};

const getFetch = function (request, reply) {

    return reply(request.pre.m5 + '\n');
};

const errorHandler = function (request, reply) {

    return reply(new Error('myerror'));
};

const echoHandler = function (request, reply) {

    return reply(request.payload);
};

module.exports.setupServer = function (done) {

    const server = new Hapi.Server();
    server.connection();
    server.route([
        { method: 'POST', path: '/echo', handler: echoHandler },
        { method: 'PUT', path: '/echo', handler: echoHandler },
        { method: 'GET', path: '/profile', handler: profileHandler },
        { method: 'GET', path: '/item', handler: activeItemHandler },
        { method: 'GET', path: '/array', handler: arrayHandler },
        { method: 'GET', path: '/item/{id}', handler: itemHandler },
        { method: 'GET', path: '/item2/{id?}', handler: item2Handler },
        { method: 'GET', path: '/zero', handler: zeroIntegerHandler },
        { method: 'GET', path: '/int', handler: integerHandler },
        { method: 'GET', path: '/int/{id}', handler: integerItemHandler },
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
        { method: 'GET', path: '/redirect', handler: redirectHandler }
    ]);

    server.register(Bassmaster, done);
    return server;
};

module.exports.makeRequest = function (server, payload, callback) {

    server.connections[0].inject({
        method: 'post',
        url: '/batch',
        payload: payload
    }, (res) => callback(res.result));
};

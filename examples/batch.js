// Load modules

var Hapi = require('hapi');


// Declare internals

var internals = {};


/**
 * To Test:
 *
 * Run the server and try a batch request like the following:
 *
 * POST /batch
 *     { "requests": [{ "method": "get", "path": "/profile" }, { "method": "get", "path": "/item" }, { "method": "get", "path": "/item/$1.id" }]
 *
 * or a GET request to http://localhost:8080/request will perform the above request for you
 */


internals.profile = function (request, reply) {

    return reply({
        'id': 'fa0dbda9b1b',
        'name': 'John Doe'
    });
};


internals.activeItem = function (request, reply) {

    return reply({
        'id': '55cf687663',
        'name': 'Active Item'
    });
};


internals.item = function (request, reply) {

    return reply({
        'id': request.params.id,
        'name': 'Item'
    });
};


internals.requestBatch = function (request, reply) {

    internals.http.inject({
        method: 'POST',
        url: '/batch',
        payload: '{ "requests": [{ "method": "get", "path": "/profile" }, { "method": "get", "path": "/item" }, { "method": "get", "path": "/item/$1.id" }] }'
    }, function (res) {

        reply(res.result);
    });
};


internals.main = function () {

    internals.http = new Hapi.Server();
    internals.http.connection({ port: 8080 });

    internals.http.route([
        { method: 'GET', path: '/profile', handler: internals.profile },
        { method: 'GET', path: '/item', handler: internals.activeItem },
        { method: 'GET', path: '/item/{id}', handler: internals.item },
        { method: 'GET', path: '/request', handler: internals.requestBatch }
    ]);

    internals.http.register(require('../'), function (err) {

        if (err) {
            console.log(err);
        }
        else {
            internals.http.start(function () {

                console.log('Server started.');
            });
        }
    });
};


internals.main();

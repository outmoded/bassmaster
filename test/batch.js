// Load modules

var Lab = require('lab');
var Sinon = require('sinon');
var Async = require('async');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Batch', function () {

    var server = null;

    var profileHandler = function (request, reply) {
        var id = request.query.id || 'fa0dbda9b1b';

        reply({
            'id': id,
            'name': 'John Doe'
        });
    };

    var activeItemHandler = function (request, reply) {

        reply({
            'id': '55cf687663',
            'name': 'Active Item'
        });
    };

    var itemHandler = function (request, reply) {

        reply({
            'id': request.params.id,
            'name': 'Item'
        });
    };

    var item2Handler = function (request, reply) {

        reply({
            'id': request.params.id || 'mystery-guest',
            'name': 'Item'
        });
    };

    var badCharHandler = function (request, reply) {

        reply({
            'id': 'test',
            'name': Date.now()
        });
    };

    var badValueHandler = function (request, reply) {

        reply(null);
    };

    var redirectHandler = function (request, reply) {

        reply().redirect('/profile');
    };

    var fetch1 = function (request, next) {

        next('Hello');
    };

    var fetch2 = function (request, next) {

        next(request.pre.m1 + request.pre.m3 + request.pre.m4);
    };

    var fetch3 = function (request, next) {

        process.nextTick(function () {

            next(' ');
        });
    };

    var fetch4 = function (request, next) {

        next('World');
    };

    var fetch5 = function (request, next) {

        next(request.pre.m2 + '!');
    };

    var getFetch = function (request, reply) {

        reply(request.pre.m5 + '\n');
    };

    var errorHandler = function (request, reply) {

        reply(new Error('myerror'));
    };

    var echoHandler = function (request, reply) {

        reply(request.payload);
    };

    function setupServer(done) {

        server = new Hapi.Server(0);
        server.route([
            { method: 'POST', path: '/echo', handler: echoHandler },
            { method: 'PUT', path: '/echo', handler: echoHandler },
            { method: 'GET',  path: '/profile', handler: profileHandler },
            { method: 'GET',  path: '/item', handler: activeItemHandler },
            { method: 'GET',  path: '/item/{id}', handler: itemHandler },
            { method: 'GET',  path: '/item2/{id?}', handler: item2Handler },
            { method: 'GET',  path: '/error', handler: errorHandler },
            { method: 'GET',  path: '/badchar', handler: badCharHandler },
            { method: 'GET',  path: '/badvalue', handler: badValueHandler },
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
        ]);

        server.pack.require('../', done);
    }

    function makeRequest(payload, callback) {

        var next = function (res) {

            return callback(res.result);
        };

        server.inject({
            method: 'post',
            url: '/batch',
            payload: payload
        }, next);
    }

    before(setupServer);

    it('shows single response when making request for single endpoint', function (done) {

        makeRequest('{ "requests": [{ "method": "get", "path": "/profile" }] }', function (res) {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports redirect', function (done) {

        makeRequest('{ "requests": [{ "method": "get", "path": "/redirect" }] }', function (res) {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports query string in the request', function (done) {
        makeRequest('{ "requests": [{ "method": "get", "path": "/profile?id=someid" }] }', function (res) {

            expect(res[0].id).to.equal('someid');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports non alphanum characters in the request', function (done) {
        makeRequest('{ "requests": [{ "method": "get", "path": "/item/item-_^~&-end" }] }', function (res) {

            expect(res[0].id).to.equal('item-_^~&-end');
            expect(res[0].name).to.equal('Item');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('shows two ordered responses when requesting two endpoints', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/profile"}, {"method": "get", "path": "/item"}] }', function (res) {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(2);
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Active Item');
            done();
        });
    });

    it('shows two ordered responses when requesting two endpoints (with optional path param)', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/item2/john"}, {"method": "get", "path": "/item2/"}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('john');
            expect(res[1].id).to.equal('mystery-guest');
            done();
        });
    });

    it('handles a large number of batch requests in parallel', function (done) {

        var requestBody = '{ "requests": [{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/item"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/profile"},' +
            '{"method": "get", "path": "/fetch"}' +
            '] }';

        var asyncSpy = Sinon.spy(Async, 'parallel');
        makeRequest(requestBody, function (res) {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(80);
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Active Item');
            expect(asyncSpy.args[0][0].length).to.equal(80);
            done();
        });
    });

    it('supports piping a response into the next request', function (done) {

        makeRequest('{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.id"}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('supports posting multiple requests', function (done) {

        makeRequest('{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":{"a":2}}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0]).to.eql({a:1});
            expect(res[1]).to.eql({a:2});
            done();
        });
    });

    it('supports sending multiple PUTs requests', function (done) {

        makeRequest('{ "requests": [ {"method": "put", "path": "/echo", "payload":{"a":1}}, {"method": "put", "path": "/echo", "payload":{"a":2}}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0]).to.eql({a:1});
            expect(res[1]).to.eql({a:2});
            done();
        });
    });

    it('supports piping a response from post into the next get request', function (done) {

        makeRequest('{ "requests": [ {"method": "post", "path": "/echo", "payload": {"id":"55cf687663"}}, {"method": "get", "path": "/item/$0.id"}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('handles null payloads gracefully', function (done) {

        makeRequest('{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":null}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0]).to.eql({a:1});
            expect(res[1]).to.eql({});
            done();
        });
    });

    it('includes errors when they occur in the request', function (done) {

        makeRequest('{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/nothere"}] }', function (res) {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].error).to.exist;
            done();
        });
    });

    it('bad requests return the correct error', function (done) {

        makeRequest('{ "blah": "test" }', function (res) {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles bad paths in requests array', function (done) {

        makeRequest('{ "requests": [ {"method": "get", "path": "/$1"}] }', function (res) {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles errors in the requested handlers', function (done) {

        makeRequest('{ "requests": [ {"method": "get", "path": "/error"}] }', function (res) {

            expect(res[0].statusCode).to.equal(500);
            done();
        });
    });

    it('an out of bounds reference returns an error', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$1.id"}] }', function (res) {

            expect(res.error).to.equal('Bad Request');
            done();
        });
    });

    it('a non-existant reference returns an internal error', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.nothere"}] }', function (res) {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('handles a bad character in the reference value', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/badchar"}, {"method": "get", "path": "/item/$0.name"}] }', function (res) {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('cannot use invalid character to request reference', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$:.name"}] }', function (res) {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles missing reference', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$0.name"}] }', function (res) {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('handles error when getting reference value', function (done) {

        makeRequest('{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.1"}] }', function (res) {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('supports an optional query object', function (done) {

        makeRequest('{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "someid" } }] }', function(res){

            expect(res[0].id).to.equal('someid');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports alphanum characters in the query', function (done) {

        makeRequest('{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "item-_^~&-end" } }] }', function(res){

            expect(res[0].id).to.equal('item-_^~&-end');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('handles null queries gracefully', function (done) {

        makeRequest('{ "requests": [ {"method": "post", "path": "/echo", "query": null}] }', function (res) {

            expect(res.length).to.equal(1);
            expect(res[0]).to.eql({});
            done();
        });
    });
});

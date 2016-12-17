'use strict';

// Load modules

const Async = require('async');
const Code = require('code');
const Lab = require('lab');
const Sinon = require('sinon');
const Internals = require('./internals.js');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const expect = Code.expect;

let server = null;

describe('Batch', () => {

    before((done) => {

        server = Internals.setupServer(done);
    });

    it('shows single response when making request for single endpoint', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile" }] }', (res) => {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports redirect', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/redirect" }] }', (res) => {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports query string in the request', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile?id=someid" }] }', (res) => {

            expect(res[0].id).to.equal('someid');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports non alphanum characters in the request', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/item/item-_^~&-end" }] }', (res) => {

            expect(res[0].id).to.equal('item-_^~&-end');
            expect(res[0].name).to.equal('Item');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('shows two ordered responses when requesting two endpoints', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/profile"}, {"method": "get", "path": "/item"}] }', (res) => {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(2);
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Active Item');
            done();
        });
    });

    it('shows two ordered responses when requesting two endpoints (with optional path param)', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item2/john"}, {"method": "get", "path": "/item2/"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('john');
            expect(res[1].id).to.equal('mystery-guest');
            done();
        });
    });

    it('handles a large number of batch requests in parallel', (done) => {

        const requestBody = '{ "requests": [{"method": "get", "path": "/profile"},' +
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

        const asyncSpy = Sinon.spy(Async, 'parallel');
        Internals.makeRequest(server, requestBody, (res) => {

            expect(res[0].id).to.equal('fa0dbda9b1b');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(80);
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Active Item');
            expect(asyncSpy.args[0][0].length).to.equal(80);
            done();
        });
    });

    it('supports piping a response into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('supports piping Id\'s with "-" (like a uuid) into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idWithDash"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].idWithDash).to.equal('55cf-687663-55cf687663');
            expect(res[1].id).to.equal('55cf-687663-55cf687663');
            done();
        });
    });

    it('supports piping interesting Ids with "." (like a filename) into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idLikeFilename"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].idLikeFilename).to.equal('55cf687663.png');
            expect(res[1].id).to.equal('55cf687663.png');
            done();
        });
    });

    it('supports piping interesting Ids with "-" and "." (like a filename) into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idLikeFileNameWithDash"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].idLikeFileNameWithDash).to.equal('55cf-687663-55cf687663.png');
            expect(res[1].id).to.equal('55cf-687663-55cf687663.png');
            done();
        });
    });

    it('supports piping a deep response into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/deepItem"}, {"method": "post", "path": "/echo", "payload": "$0.inner.name"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.name"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.inner.name"}] }', (res) => {

            expect(res.length).to.equal(4);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Deep Item');
            expect(res[1]).to.equal('Level 1');
            expect(res[2]).to.equal('Level 2');
            expect(res[3]).to.equal('Level 3');
            done();
        });
    });

    it('supports piping a deep response into an array in the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/deepItem"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.inner.array.0.name"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Deep Item');
            expect(res[1]).to.equal('Array Item 0');
            done();
        });
    });

    it('supports piping integer response into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/int"}, {"method": "get", "path": "/int/$0.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal(123);
            expect(res[0].name).to.equal('Integer Item');
            expect(res[1].id).to.equal('123');
            expect(res[1].name).to.equal('Integer');
            done();
        });
    });

    it('supports the return of strings instead of json', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/string"}, {"method": "get", "path": "/item/$0.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('String Item');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('supports piping a zero integer response into the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/zero"}, {"method": "get", "path": "/int/$0.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal(0);
            expect(res[0].name).to.equal('Zero Item');
            expect(res[1].id).to.equal('0');
            expect(res[1].name).to.equal('Integer');
            done();
        });
    });

    it('supports posting multiple requests', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":{"a":2}}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0]).to.deep.equal({ a: 1 });
            expect(res[1]).to.deep.equal({ a: 2 });
            done();
        });
    });

    it('supports sending multiple PUTs requests', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "put", "path": "/echo", "payload":{"a":1}}, {"method": "put", "path": "/echo", "payload":{"a":2}}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0]).to.deep.equal({ a: 1 });
            expect(res[1]).to.deep.equal({ a: 2 });
            done();
        });
    });

    it('supports piping a response from post into the next get request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": {"id":"55cf687663"}}, {"method": "get", "path": "/item/$0.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('supports piping a nested response value from post into the next get request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": { "data": {"id":"44cf687663"}}}, {"method": "get", "path": "/item/$0.data.id"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].data.id).to.equal('44cf687663');
            expect(res[1].id).to.equal('44cf687663');
            expect(res[1].name).to.equal('Item');
            done();
        });
    });

    it('handles null payloads gracefully', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":null}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0]).to.deep.equal({ a: 1 });
            expect(res[1]).to.deep.equal(null);
            done();
        });
    });

    it('includes errors when they occur in the request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/nothere"}] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].error).to.exist();
            done();
        });
    });

    it('bad requests return the correct error', (done) => {

        Internals.makeRequest(server, '{ "blah": "test" }', (res) => {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });


    it('handles empty payload', (done) => {

        Internals.makeRequest(server, null, (res) => {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles payload request not array', (done) => {

        Internals.makeRequest(server, '{ "requests": {"method": "get", "path": "/$1"} }', (res) => {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles bad paths in requests array', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/$1"}] }', (res) => {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles errors in the requested handlers', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/error"}] }', (res) => {

            expect(res[0].statusCode).to.equal(500);
            done();
        });
    });

    it('an out of bounds reference returns an error', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$1.id"}] }', (res) => {

            expect(res.error).to.equal('Bad Request');
            done();
        });
    });

    it('a non-existant reference returns an internal error', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.nothere"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('a non-existant & nested reference returns an internal error', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": { "data": {"id":"44cf687663"}}}, {"method": "get", "path": "/item/$0.data.not.here"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('handles a bad character in the reference value', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badchar"}, {"method": "get", "path": "/item/$0.invalidChar"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('handles a null value in the reference value', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badchar"}, {"method": "get", "path": "/item/$0.null"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('cannot use invalid character to request reference', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$:.name"}] }', (res) => {

            expect(res.statusCode).to.equal(400);
            done();
        });
    });

    it('handles missing reference', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$0.name"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('handles error when getting reference value', (done) => {

        Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.1"}] }', (res) => {

            expect(res.statusCode).to.equal(500);
            done();
        });
    });

    it('supports an optional query object', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "someid" } }] }', (res) => {

            expect(res[0].id).to.equal('someid');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('supports alphanum characters in the query', (done) => {

        Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "item-_^~&-end" } }] }', (res) => {

            expect(res[0].id).to.equal('item-_^~&-end');
            expect(res[0].name).to.equal('John Doe');
            expect(res.length).to.equal(1);
            done();
        });
    });

    it('handles null queries gracefully', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "query": null}] }', (res) => {

            expect(res.length).to.equal(1);
            expect(res[0]).to.deep.equal(null);
            done();
        });
    });

    it('supports piping a whole payload to the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0"} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].id).to.equal('55cf687663');
            expect(res[1].name).to.equal('Active Item');
            done();
        });
    });

    it('supports piping a partial payload to the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0.name"} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1]).to.equal('Active Item');
            done();
        });
    });

    it('supports piping a partial payload from a nested array to the next request', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/array"}, {"method": "post", "path": "/echo", "payload":"$0.items.1"} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Dress');
            expect(res[1].color).to.equal('whiteandgold');
            done();
        });
    });

    it('returns an empty object when a non-existent path is set at the root of the payload', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0.foo"} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1]).to.be.empty();
            done();
        });
    });

    it('sets a nested reference in the payload', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":{"name2": "$0.name"}} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].name2).to.equal('Active Item');
            done();
        });
    });

    it('returns an empty object when a nonexistent path is set in the payload', (done) => {

        Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":{"foo": "$0.foo"}} ] }', (res) => {

            expect(res.length).to.equal(2);
            expect(res[0].id).to.equal('55cf687663');
            expect(res[0].name).to.equal('Active Item');
            expect(res[1].foo).to.be.empty();

            done();
        });
    });

    it('works with multiple connections', (done) => {

        // Add a connection to the server
        server.connection({ port: 8000, host: 'localhost', labels: ['test'] });

        Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "query": null}] }', (res) => {

            expect(res.length).to.equal(1);
            expect(res[0]).to.deep.equal(null);

            done();
        });
    });
});

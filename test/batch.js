'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Internals = require('./internals.js');

// Test shortcuts

const lab = exports.lab = Lab.script();
const { describe, it, before } = lab;
const { expect } = Code;

let server = null;

describe('Batch', () => {

    before( async () => {

        server = await Internals.setupServer();
    });

    it('shows single response when making request for single endpoint', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile" }] }');

        expect(res[0].id).to.equal('fa0dbda9b1b');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(1);
    });

    it('supports redirect', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/redirect" }] }');
        expect(res[0].id).to.equal('fa0dbda9b1b');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(1);
    });

    it('supports query string in the request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile?id=someid" }] }');

        expect(res[0].id).to.equal('someid');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(1);
    });

    it('supports non alphanum characters in the request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/item/item-_^~&-end" }] }');

        expect(res[0].id).to.equal('item-_^~&-end');
        expect(res[0].name).to.equal('Item');
        expect(res.length).to.equal(1);
    });

    it('shows two ordered responses when requesting two endpoints', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/profile"}, {"method": "get", "path": "/item"}] }');

        expect(res[0].id).to.equal('fa0dbda9b1b');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(2);
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Active Item');
    });

    it('shows two ordered responses when requesting two endpoints (with optional path param)', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item2/john"}, {"method": "get", "path": "/item2/"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('john');
        expect(res[1].id).to.equal('mystery-guest');
    });

    it('handles a large number of batch requests in parallel', async () => {

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

        const res = await Internals.makeRequest(server, requestBody);

        expect(res[0].id).to.equal('fa0dbda9b1b');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(80);
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Active Item');
    });

    it('supports piping a response into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Item');
    });

    it('supports piping Id\'s with "-" (like a uuid) into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idWithDash"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].idWithDash).to.equal('55cf-687663-55cf687663');
        expect(res[1].id).to.equal('55cf-687663-55cf687663');
    });

    it('supports piping interesting Ids with "." (like a filename) into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idLikeFilename"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].idLikeFilename).to.equal('55cf687663.png');
        expect(res[1].id).to.equal('55cf687663.png');
    });

    it('supports piping interesting Ids with "-" and "." (like a filename) into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/interestingIds"}, {"method": "get", "path": "/item/$0.idLikeFileNameWithDash"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].idLikeFileNameWithDash).to.equal('55cf-687663-55cf687663.png');
        expect(res[1].id).to.equal('55cf-687663-55cf687663.png');
    });

    it('supports piping a deep response into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/deepItem"}, {"method": "post", "path": "/echo", "payload": "$0.inner.name"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.name"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.inner.name"}] }');

        expect(res.length).to.equal(4);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Deep Item');
        expect(res[1]).to.equal('Level 1');
        expect(res[2]).to.equal('Level 2');
        expect(res[3]).to.equal('Level 3');
    });

    it('supports piping a deep response into an array in the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/deepItem"}, {"method": "post", "path": "/echo", "payload": "$0.inner.inner.inner.array.0.name"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Deep Item');
        expect(res[1]).to.equal('Array Item 0');
    });

    it('Does not allow piping a response greater than 500 characters in length', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/long-id"}, {"method": "get", "path": "/int/$0.id"}] }');

        expect(res.statusCode).to.equal(400);
        expect(res.error).to.equal('Bad Request');
        expect(res.message).to.equal('Reference value length exceeds the maximum of 500 characters');
    });

    it('supports the return of strings instead of json', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/string"}, {"method": "get", "path": "/item/$0.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('String Item');
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Item');
    });

    it('supports piping a zero integer response into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/zero"}, {"method": "get", "path": "/int/$0.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal(0);
        expect(res[0].name).to.equal('Zero Item');
        expect(res[1].id).to.equal('0');
        expect(res[1].name).to.equal('Integer');
    });

    it('supports piping a response into the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Item');
    });

    it('supports posting multiple requests', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":{"a":2}}] }');

        expect(res.length).to.equal(2);
        expect(res[0]).to.equal({ a: 1 });
        expect(res[1]).to.equal({ a: 2 });
    });

    it('supports sending multiple PUTs requests', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "put", "path": "/echo", "payload":{"a":1}}, {"method": "put", "path": "/echo", "payload":{"a":2}}] }');

        expect(res.length).to.equal(2);
        expect(res[0]).to.equal({ a: 1 });
        expect(res[1]).to.equal({ a: 2 });
    });

    it('supports piping a response from post into the next get request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": {"id":"55cf687663"}}, {"method": "get", "path": "/item/$0.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Item');
    });

    it('supports piping a nested response value from post into the next get request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": { "data": {"id":"44cf687663"}}}, {"method": "get", "path": "/item/$0.data.id"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].data.id).to.equal('44cf687663');
        expect(res[1].id).to.equal('44cf687663');
        expect(res[1].name).to.equal('Item');
    });

    it('handles null payloads gracefully', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload":{"a":1}}, {"method": "post", "path": "/echo", "payload":null}] }');

        expect(res.length).to.equal(2);
        expect(res[0]).to.equal({ a: 1 });
        expect(res[1]).to.equal(null);
    });

    it('includes errors when they occur in the request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "get", "path": "/nothere"}] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].error).to.exist();
    });

    it('bad requests return the correct error', async () => {

        const res = await Internals.makeRequest(server, '{ "blah": "test" }');

        expect(res.statusCode).to.equal(400);
    });


    it('handles empty payload', async () => {

        const res = await Internals.makeRequest(server, null);

        expect(res.statusCode).to.equal(400);
    });

    it('handles payload request not array', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": {"method": "get", "path": "/$1"} }');

        expect(res.statusCode).to.equal(400);
    });

    it('handles bad paths in requests array', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/$1"}] }');

        expect(res.statusCode).to.equal(400);
    });

    it('handles errors in the requested handlers', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/error"}] }');

        expect(res[0].statusCode).to.equal(500);
    });

    it('an out of bounds reference returns an error', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$1.id"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('a non-existant reference returns an error', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.nothere"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('a non-existant & nested reference returns an error', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "payload": { "data": {"id":"44cf687663"}}}, {"method": "get", "path": "/item/$0.data.not.here"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('handles a bad character in the reference value', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badchar"}, {"method": "get", "path": "/item/$0.invalidChar"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('handles a null value in the reference value', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badchar"}, {"method": "get", "path": "/item/$0.null"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('cannot use invalid character to request reference', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$:.name"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('handles missing reference', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/badvalue"}, {"method": "get", "path": "/item/$0.name"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('handles error when getting reference value', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{"method": "get", "path": "/item"}, {"method": "get", "path": "/item/$0.1"}] }');

        expect(res.error).to.equal('Bad Request');
    });

    it('supports an optional query object', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "someid" } }] }');

        expect(res[0].id).to.equal('someid');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(1);
    });

    it('supports alphanum characters in the query', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [{ "method": "get", "path": "/profile", "query": { "id": "item-_^~&-end" } }] }');

        expect(res[0].id).to.equal('item-_^~&-end');
        expect(res[0].name).to.equal('John Doe');
        expect(res.length).to.equal(1);
    });

    it('handles null queries gracefully', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "post", "path": "/echo", "query": null}] }');

        expect(res.length).to.equal(1);
        expect(res[0]).to.equal(null);
    });

    it('supports piping a whole payload to the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0"} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].id).to.equal('55cf687663');
        expect(res[1].name).to.equal('Active Item');
    });

    it('supports piping a partial payload to the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0.name"} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1]).to.equal('Active Item');
    });

    it('supports piping a partial payload from a nested array to the next request', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/array"}, {"method": "post", "path": "/echo", "payload":"$0.items.1"} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Dress');
        expect(res[1].color).to.equal('whiteandgold');
    });

    it('returns an empty object when a non-existent path is set at the root of the payload', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":"$0.foo"} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1]).to.be.empty();
    });

    it('sets a nested reference in the payload', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":{"name2": "$0.name"}} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].name2).to.equal('Active Item');
    });

    it('returns an empty object when a nonexistent path is set in the payload', async () => {

        const res = await Internals.makeRequest(server, '{ "requests": [ {"method": "get", "path": "/item"}, {"method": "post", "path": "/echo", "payload":{"foo": "$0.foo"}} ] }');

        expect(res.length).to.equal(2);
        expect(res[0].id).to.equal('55cf687663');
        expect(res[0].name).to.equal('Active Item');
        expect(res[1].foo).to.be.empty();

    });
});

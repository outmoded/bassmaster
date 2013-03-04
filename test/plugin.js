// Load modules

var Chai = require('chai');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('bassmaster', function () {

    it('can be added as a plugin to hapi', function (done) {

        var server = new Hapi.Server();
        server.plugin().require('../', { plugin: { /* Set any plugin options here */ } }, function (err) {

            expect(err).to.not.exist;
            done();
        });
    });
});
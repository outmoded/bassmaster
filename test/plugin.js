// Load modules

var Code = require('code');
var Bassmaster = require('../');
var Lab = require('lab');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('bassmaster', function () {

    it('can be added as a plugin to hapi', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster }, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });

    it('can be given a custom route url', function (done) {

        var server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { batchEndpoint: '/custom' }}, function (err) {

            expect(err).to.not.exist();
            var path = server.connections[0].table()[0].path;
            expect(path).to.equal('/custom');
            done();
        });
    });

    it('can be given a custom description', function(done){

        var server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { description: 'customDescription' }}, function (err) {

            expect(err).to.not.exist();
            var description = server.connections[0].table()[0].settings.description;
            expect(description).to.equal('customDescription');
            done();
        });
    });

    it('can be given an authentication strategy', function(done){

        var server = new Hapi.Server();
        var mockScheme = {
          authenticate: function () {return null;},
          payload: function() {return null;},
          response: function() {return null;}
        };
        server.auth.scheme('mockScheme', function(){return mockScheme;});
        server.auth.strategy('mockStrategy','mockScheme');
        server.register({ plugin: Bassmaster, options: { auth: 'mockStrategy' }}, function (err) {

            expect(err).to.not.exist;
            var auth = server.table()[0].settings.auth.strategies[0];
            expect(auth).to.equal('mockStrategy');
            done();
        });
    });

    it('can be given custom tags', function(done){

        var server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { tags: ['custom', 'tags'] }}, function (err) {

            expect(err).to.not.exist();
            var tags = server.connections[0].table()[0].settings.tags;
            expect(tags).to.deep.equal(['custom', 'tags']);
            done();
        });
    });
});

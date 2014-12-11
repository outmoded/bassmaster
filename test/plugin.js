// Load modules

var Lab = require('lab');
var Hapi = require('hapi');
var Bassmaster = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var describe = Lab.experiment;
var it = Lab.test;


describe('bassmaster', function () {

    it('can be added as a plugin to hapi', function (done) {

        var server = new Hapi.Server();
        server.pack.register({ plugin: Bassmaster }, function (err) {

            expect(err).to.not.exist;
            done();
        });
    });

    it('can be given a custom route url', function (done) {

        var server = new Hapi.Server();
        server.pack.register({ plugin: Bassmaster, options: { batchEndpoint: '/custom' }}, function (err) {

            expect(err).to.not.exist;
            var path = server.table()[0].settings.path;
            expect(path).to.equal('/custom');
            done();
        });
    });

    it('can be given a custom description', function(done){

        var server = new Hapi.Server();
        server.pack.register({ plugin: Bassmaster, options: { description: 'customDescription' }}, function (err) {

            expect(err).to.not.exist;
            var description = server.table()[0].settings.description;
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
        server.pack.register({ plugin: Bassmaster, options: { auth: 'mockStrategy' }}, function (err) {

            expect(err).to.not.exist;
            var auth = server.table()[0].settings.auth.strategies[0];
            expect(auth).to.equal('mockStrategy');
            done();
        });
    });

    it('can be given custom tags', function(done){

        var server = new Hapi.Server();
        server.pack.register({ plugin: Bassmaster, options: { tags: ['custom', 'tags'] }}, function (err) {

            expect(err).to.not.exist;
            var tags = server.table()[0].settings.tags;
            expect(tags).to.deep.equal(['custom', 'tags']);
            done();
        });
    });
});

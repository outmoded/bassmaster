'use strict';

// Load modules

const Code = require('code');
const Bassmaster = require('../');
const Lab = require('lab');
const Hapi = require('hapi');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('bassmaster', () => {

    it('can be added as a plugin to hapi', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster }, (err) => {

            expect(err).to.not.exist();
            done();
        });
    });

    it('can be given a custom route url', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { batchEndpoint: '/custom' } }, (err) => {

            expect(err).to.not.exist();
            const path = server.connections[0].table()[0].path;
            expect(path).to.equal('/custom');
            done();
        });
    });

    it('can be given a custom description', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { description: 'customDescription' } }, (err) => {

            expect(err).to.not.exist();
            const description = server.connections[0].table()[0].settings.description;
            expect(description).to.equal('customDescription');
            done();
        });
    });

    it('can be given an authentication strategy', (done) => {

        const server = new Hapi.Server();
        server.connection();
        const mockScheme = {
            authenticate: () => {

                return null;
            },
            payload: () => {

                return null;
            },
            response: () => {

                return null;
            }
        };
        server.auth.scheme('mockScheme', () => {

            return mockScheme;
        });
        server.auth.strategy('mockStrategy', 'mockScheme');
        server.register({ register: Bassmaster, options: { auth: 'mockStrategy' } }, (err) => {

            expect(err).to.not.exist();
            const auth = server.connections[0].table()[0].settings.auth.strategies[0];
            expect(auth).to.equal('mockStrategy');
            done();
        });
    });

    it('can be given custom tags', (done) => {

        const server = new Hapi.Server();
        server.connection();
        server.register({ register: Bassmaster, options: { tags: ['custom', 'tags'] } }, (err) => {

            expect(err).to.not.exist();
            const tags = server.connections[0].table()[0].settings.tags;
            expect(tags).to.deep.equal(['custom', 'tags']);
            done();
        });
    });
});

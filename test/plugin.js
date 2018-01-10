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
const { expect, fail } = Code;


describe('bassmaster', () => {

    it('can be added as a plugin to hapi', async () => {

        const server = new Hapi.Server();

        try {
            await server.register(Bassmaster);
        }
        catch (e) {
            fail('Plugin failed to register');
        }

        expect(true).to.be.true();
    });

    it('can be given a custom route url', async () => {

        const server = new Hapi.Server();

        try {
            await server.register({ plugin: Bassmaster, options: { batchEndpoint: '/custom' } });
        }
        catch (e) {
            fail('Plugin failed to register');
        }

        const path = server.table()[0].path;
        expect(path).to.equal('/custom');
    });

    it('can be given a custom description', async () => {

        const server = new Hapi.Server();
        try {
            await server.register({ plugin: Bassmaster, options: { description: 'customDescription' } });
        }
        catch (e) {
            fail('Plugin failed to register');
        }

        const description = server.table()[0].settings.description;
        expect(description).to.equal('customDescription');
    });

    it('can be given an authentication strategy', async () => {

        const server = new Hapi.Server();
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

        try {
            await server.register({ plugin: Bassmaster, options: { auth: 'mockStrategy' } });
        }
        catch (e) {
            fail('Plugin failed to register');
        }

        const auth = server.table()[0].settings.auth.strategies[0];
        expect(auth).to.equal('mockStrategy');
    });

    it('can be given custom tags', async () => {

        const server = new Hapi.Server();
        try {
            await server.register({ plugin: Bassmaster, options: { tags: ['custom', 'tags'] } });
        }
        catch (e) {
            fail('Plugin failed to register');
        }

        const tags = server.table()[0].settings.tags;
        expect(tags).to.equal(['custom', 'tags']);
    });
});

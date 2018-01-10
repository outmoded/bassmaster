'use strict';

// Load modules

const Hoek = require('hoek');
const Batch = require('./batch');
const Pkg = require('../package.json');
const { name } = Pkg;

// Declare internals

const internals = {
    defaults: {
        batchEndpoint: '/batch',
        description: 'Batch endpoint',
        notes: 'A batch endpoint that makes it easy to combine multiple requests to other endpoints in a single call.',
        tags: ['bassmaster']
    }
};

const register = function (server, options) {

    const settings = Hoek.applyToDefaults(internals.defaults, options);

    server.route({
        method: 'POST',
        path: settings.batchEndpoint,
        config: Batch.config(settings)
    });
};

exports.plugin = { register, name, Pkg };

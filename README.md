![bassmaster Logo](https://raw.github.com/spumko/bassmaster/master/images/bassmaster.png)

Bassmaster makes it easy to combine requests into a single one. It also supports pipelining, allowing you to take the result of one query in the batch request and use it in a subsequent one.  The batch endpoint only responds to POST requests.

[![Build Status](https://secure.travis-ci.org/hapijs/bassmaster.png)](http://travis-ci.org/hapijs/bassmaster)

[![NPM](https://nodei.co/npm/bassmaster.png?downloads=true&stars=true)](https://nodei.co/npm/bassmaster/)

Lead Maintainer: [Christopher De Cairos](https://github.com/cadecairos)


## Getting Started
Install **bassmaster** by either running `npm install bassmaster` in your sites working directory or add 'bassmaster' to the dependencies section of the 'package.json' file and run `npm install`.

### Available options
At this time the options object supports the following configuration:
- `batchEndpoint` - the path where batch requests will be served from.  Default is '/batch'.
- `description` - route description used for generating documentation. Default is 'Batch endpoint'
- `notes` - route notes used for generating documentation. Default is 'A batch endpoint which makes it easy to combine multiple requests to other endpoints in a single call.'
- `tags` - route tags used for generating documentation. Default is ['bassmaster']
- `auth` - If you need the batch route to have authentication

As an example to help explain the use of the endpoint, assume that the server has a route at '/currentuser' and '/users/{id}/profile/'.
You can make a POST request to the batch endpoint with the following body and it will return an array with the current user and their profile.
Pipelining uses [Hoek.reach](https://www.npmjs.com/package/hoek#reach-obj-chain-options) to retrieve values from request results.

```json
{ "requests": [
    {"method": "get", "path": "/currentuser"},
    {"method": "get", "path": "/users/$0.id/profile"}
] }
```

The response body to the batch endpoint is an ordered array of the response to each request.  Therefore, if you make a request to the batch endpoint that looks like

```json
{ "requests": [
    {"method": "get", "path": "/users/1"},
    {"method": "get", "path": "/users/2"}
] }
```

The response will look like the following, where the first item in the response array is the result of the request from the first item in the request array.

```json
[{"userId": "1", "username": "bob"}, {"userId": "2", "username": "billy" }]
```

When making a POST request as part of the batch assign the _'payload'_ property with the contents of the payload to send.

Optionally you can assign the query as a third property rather than placing it directly into the path. The query property accepts an object that will be formatted into a querystring.

```json
{ "requests": [
    { "method": "get", "path": "/users/1", "query": { "id": "23", "user": "John" } }
] }
```

If an error occurs as a result of one the requests to an endpoint it will be included in the response in the same location in the array as the request causing the issue.  The error object will include an error property that you can interrogate.  At this time the response is a 200 even when a request in the batch returns a different code.

By default, requests in the `"requests"` array will be run concurrently, with the exception of pipelined requests which will be run sequentially.
To force all batched requests to run sequentially regardless of pipelining, pass in the `forceSequential: true` flag:

```json
{ "forceSequential": true,
  "requests": [
    {"method": "get", "path": "/users/1"},
    {"method": "get", "path": "/users/2"}
] }
```

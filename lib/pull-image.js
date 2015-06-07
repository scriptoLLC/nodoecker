'use strict';

var querystring = require('querystring');
var DockerObj = require('./docker-object');
var debug = require('debug')('nodoecker');

/**
 * Pulls an image from the registry
 * @promise
 * @memberOf Nodoedocker
 * @param {string} imageName name of
 * @param {object} opts      parameters for request
 * @param {string} [opts.fromSrc]   URL to the source to import
 * @param {string} [opts.repo] repository to pull from
 * @param {string} [opts.tag] what tag to pull
 * @param {string} [opts.registry] which registry to use
 * @param {boolean|string} [opts.auth] should we end the auth string. defaults to the auth string created when instantiating the client, otherwise one can be provided here
 * @return {Promise} resolve -> image, reject -> err
 */
module.exports = function pullImage(opts) {
  opts = opts || {};
  var params = {
    body: null
  };

  if (opts.auth) {
    params.headers = {
      'X-Registry-Auth': this.authStr || opts.auth
    };
    delete opts.auth;
  }

  opts.fromImage = this._reference;
  var qs = querystring.stringify(opts);
  var imgUrl = '/images/create?' + qs;

  return this.dkr
    .post(imgUrl, params)
    .bind(this)
    .then(function(res) {
      var msg;
      if (/errorDetail/.test(res)) {
        debug('Error', res);
        msg = JSON.parse(res.match(/errorDetail\"\:(.*?),/)[1]);
        throw new Error(msg.message);
      }

      var imgOpts = {
        host: this.host,
        authStr: this.authStr,
        tag: opts.tag
      };

      return new DockerObj(this.name, 'image', imgOpts);
    })
    .catch(function(err) {
      throw err;
    });
};

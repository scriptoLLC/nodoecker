'use strict';

var querystring = require('querystring');

var dr = require('docker-remote-api');
var xtend = require('xtend');
var Promise = require('native-or-bluebird');

var Container = require('./container');
var Image = require('./image');

var dockerRegistry = 'https://index.docker.io/v1';

/**
 * Create a new instance of Nodöcker
 * @class
 * @param {string} host the docker host or socket
 * @param {object} auth an AuthConfig object
 * @param {string} [auth.username] username to use for authed queries
 * @param {string} [auth.passwod] password to use for authed queries
 * @param {string} [auth.serveraddress=https://index.docker.io/v1] the registry
 * @param {string} auth.email your email address
 */
function Nodoecker(host, auth){
  auth = auth || {};
  this.dkr = Promise.promisifyAll(dr({host: host}));
  this.authStr = this._makeAuth(auth);
}

/**
 * Create a base64 auth string from an AuthConfig object
 * @memberOf Nodoecker
 * @method _makeAuth
 * @private
 * @param {object} auth AuthConfig object
 * @returns {string} base64 encoded JSON.stringify'ed representation of AuthConfig
 */
Nodoecker.prototype._makeAuth = function(auth){
  var a = {
    username: auth.username || '',
    password: auth.password || '',
    serveraddress: auth.serveraddress || dockerRegistry,
    email: auth.email
  };

  return new Buffer(JSON.stringify(a)).toString('base64');
};

/**
 * Create a new container on the docker server
 * @method run
 * @promise
 * @param {object} details details about the container to launch. Details: https://docs.docker.com/reference/api/docker_remote_api_v1.17/#create-a-container
 * @param {string} name what to name the container
 * @returns {container} the container will be returned to the promise
 */
Nodoecker.prototype.run = function(details, name) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (!/^\/?[a-zA-Z0-9_-]+/.test(name)) {
      throw new Error('Name can only consist of characters a-z, A-Z, 0-9, _ and -');
    }

    var defaultDetails = {
      Hostname: "",
      Domainname: "",
      User: "",
      Memory: 0,
      MemorySwap: 0,
      CpuShares: 512,
      Cpuset: "0,1",
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
      Env: null,
      Cmd: [],
      Entrypoint: "",
      Image: "",
      Volumes: {},
      WorkingDir: "",
      NetworkDisabled: false,
      ExposedPorts: {},
      SecurityOpts: [""],
      HostConfig: {
        Binds: [],
        Links: [],
        LxcConf: {},
        PortBindings: {},
        PublishAllPorts: false,
        Privileged: false,
        ReadonlyRootfs: false,
        Dns: [],
        DnsSearch: [""],
        ExtraHosts: null,
        VolumesFrom: [],
        CapAdd: [],
        Capdrop: [],
        RestartPolicy: {"Name": "", "MaximumRetryCount": 0},
        NetworkMode: "bridge",
        Devices: []
      }
    };

    details = xtend(defaultDetails, details);

    var opts = {
      qs: {name: name},
      json: true
    };

    var req = self.dkr.post('/containers/create', opts, function(err, resp) {
      if (err) {
        return reject(err);
      }
      resolve(new Container(xtend(resp, details)));
    });

    req.send(details);
  });
};

/**
 * List all images in docker instance
 * @method ps
 * @memberOf Nodoedocker
 * @promise
 * @param {object} params parameters for sorting/filtering
 * @param {boolean} [params.all=false] true = show all images, false = show only running
 * @param {string} [params.limit] show only x number of last created images, including non-running
 * @param {string} [params.since] show only images created since container id
 * @param {string} [params.before] show only images created before container id
 * @param {boolean} [params.size=false] show the container sizes
 * @param {object} [params.filters] a set of filters to apply to the response
 * @param {integer} [params.filters.exited] list images with the specified exit code
 * @param {string} [params.filters.status] list images with status: restarting, running, paused, exiting
 * @returns {container[]} an array of container objects when the promise fulfills
 */
Nodoecker.prototype.images = Promise.method(function(params) {
  params = params || {};

  if (params.filters) {
    params.filters = JSON.stringify(params.filters);
  }

  var opts = {
    qs: params,
    json: true
  };

  this.dkr.getAsync('/images/json', opts)
    .bind(this)
    .then(function(response) {
      var images = response.map(function(container){
        return new Image(container, this.dkr);
      });
      return images;
  });
});

/**
 * Returns an instance of an Image.
 * @param  {string} name Name or ID of image
 * @param  {object} opts options
 * @param  {boolean} [opts.delay] Set to `true` if you want to load the data about the image at a later time
 * @return {object} Image
 */
Nodoecker.prototype.image = function(name, opts) {
  opts = opts || {};
  opts.docker = this.dkr;
  return new Image(name, opts);
};

/**
 * Pulls an image from the registry
 * @param {string} imageName name of
 * @param {object} opts      parameters for request
 * @param {string} [opts.fromSrc]   URL to the source to import
 * @param {string} [opts.repo] repository to pull from
 * @param {string} [opts.tag] what tag to pull
 * @param {string} [opts.registry] which registry to use
 * @param {boolean|string} [opts.auth] should we end the auth string. defaults to the auth string created when instantiating the client, otherwise one can be provided here
 * @return {Promise} resolve -> image, reject -> err
 */
Nodoecker.prototype.pull = function(imageName, opts) {
  var self = this;
  return new Promise(function(reject, resolve) {
    var params = {
      body: null,
      json: true
    };

    if (opts.auth) {
      params.headers = {
        'X-Registry-Auth': self.authStr || opts.auth
      };
      delete opts.auth;
    }
    opts.fromImage = imageName;
    var qs = querystring.stringify(opts);

    this.dkr.post('/images/create?' + qs, params, function(err) {
      if (err) {
        return reject(err);
      }
      resolve(new Image(imageName));
    });
  });
};

module.exports = Nodoecker;

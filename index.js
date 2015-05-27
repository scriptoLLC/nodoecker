'use strict';

var querystring = require('querystring');

var draap = require('docker-remote-api-as-promised');
var xtend = require('xtend');
var Promise = require('native-or-bluebird');

var DockerObj = require('./docker-object');

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
  this.host = host;
  this.auth = auth;
  this.dkr = draap(host);
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
Nodoecker.prototype.run = function(name, image, details) {
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
    Image: image,
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
    body: JSON.stringify(details),
    json: true,
    headers: {
      'content-type': 'application/json'
    }
  };

  return this.dkr
    .post('/containers/create', opts)
    .bind(this)
    .then(function(container) {
      return new DockerObj(xtend(container, details), 'container');
    })
    .catch(function(err) {
      return err;
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
Nodoecker.prototype.images = function(params) {
  params = params || {};

  if (params.filters) {
    params.filters = JSON.stringify(params.filters);
  }

  var opts = {
    qs: params,
    json: true
  };

  return this.dkr
    .get('/images/json', opts)
    .bind(this)
    .then(function(images) {
      var imgOpts = {
        host: this.host,
        authStr: this.authStr,
        delay: true
      };

      return images.map(function(image) {
        return this.image(image, imgOpts);
      });
    })
    .catch(function(err) {
      return err;
    });
};

/**
 * Returns an instance of an Image.
 * @param  {string} name Name or ID of image
 * @param  {object} opts options
 * @param  {boolean} [opts.delay] Don't call `img.Inspect()`
 * @return {object} Promise -> new Image
 */
Nodoecker.prototype.image = function(name, opts) {
  opts = opts || {};
  opts.host = this.host;
  opts.authStr = this.authStr;
  var img = new DockerObj(name, 'image', opts);
  if (opts.delay) {
    return Promise.resolve(img);
  } else {
    return img.Inspect();
  }
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

  opts.fromImage = imageName;
  var qs = querystring.stringify(opts);
  var imgUrl = '/images/create?' + qs;

  return this.dkr
    .post(imgUrl, params)
    .bind(this)
    .then(function() {
      var imgOpts = {
        host: this.host,
        authStr: this.authStr,
        tag: opts.tag
      };

      return new DockerObj(imageName, 'image', imgOpts);
    })
    .catch(function(err) {
      return err;
    });
};

module.exports = Nodoecker;

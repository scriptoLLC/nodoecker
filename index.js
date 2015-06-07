'use strict';

var draap = require('docker-remote-api-as-promised');
var Promise = require('native-or-bluebird');

var DockerObj = require('./lib/docker-object');
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
 * A convience method that takes a containerName, an image and optional details
 * about the container to create and returns a running container
 * @method run
 * @param {string} containerName what to call your new container
 * @param {string|object} image either a string identifying the image, or an instance of the image object
 * @param {object} details [Container creation details](https://docs.docker.com/reference/api/docker_remote_api_v1.17/#create-a-container)
 * @returns {Promise} resolves to a container object representing the running container
 */
Nodoecker.prototype.run = function(containerName, image, details) {
  if (typeof image === 'string') {
    image = this.image(image, {delay: true});
  }

  return image.run(containerName, details);
};

/**
 * Stop a running container
 * @method stop
 * @param {string|object} container Either a string identifying the container or a container instance
 * @param {number} time The amount of time you want to delay the action
 * @returns {Promise} resolves to `true` on success
 */
Nodoecker.prototype.stop = function(container, time) {
  return this._runState('stop', container, time);
};

/**
 * Restart a running container
 * @method restart
 * @param {string|object} container Either a string identifying the container or a container instance
 * @param {number} time The amount of time you want to delay the action
 * @returns {Promise} resolves to `true` on success
 */
Nodoecker.prototype.restart = function(container, time) {
  return this._runState('restart', container, time);
};

/**
 * Starts a running container
 * @method start
 * @param {string|object} container Either a string identifying the container or a container instance
 * @param {number} time The amount of time you want to delay the action
 * @returns {Promise} resolves to `true` on success
 */
Nodoecker.prototype.start = function(container, time) {
  return this._runState('start', container, time);
};

/**
 * Actually perform the run state action on the container
 * @method _runState
 * @private
 * @memberOf Nodoecker
 * @param {string} method start|stop|restart
 * @param {string|object} container Either a string identifying the container or a container instance
 * @param {number} time The amount of time you want to delay the action
 * @returns {Promise} resolves to `true` on success
 */
Nodoecker.prototype._runState = function(method, container, time) {
  if (typeof container === 'string') {
    container = this.container(container, {delay: true});
  }

  if (!(container instanceof DockerObj)) {
    throw new Error('Container should either be a string or a container instance');
  }

  return container[method].call(container, time);
};

/**
 * Create a new image object and pull it from the remote docker registry
 * @method pull
 * @param {string} image identifying text for image
 * @param {object} opts options for pulling the image
 * @returns {Promise} resolves to a new Image object
 */
Nodoecker.prototype.pull = function(image, opts) {
  if (typeof image === 'string') {
    opts.delay = true;
    image = this.image(image, opts);
  }

  if (!(image instanceof DockerObj)) {
    throw new Error('image must either be a string or an image instance');
  }

  image.pull(opts);
};

/**
 * List all images in docker instance
 * @method _list
 * @memberOf Nodoedocker
 * @private
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
Nodoecker.prototype._list = function(type, params) {
  var listUrl = '/' + type + 's/json';
  params = params || {};

  if (params.filters) {
    params.filters = JSON.stringify(params.filters);
  }

  var opts = {
    qs: params,
    json: true
  };

  return this.dkr
    .get(listUrl, opts)
    .bind(this)
    .then(function(items) {
      var imgOpts = {
        host: this.host,
        authStr: this.authStr,
        delay: true
      };

      return items.map(function(item) {
        return this[type](item, imgOpts);
      });
    })
    .catch(function(err) {
      throw err;
    });
};

/**
 * Returns an instance of an Image.
 * @promise
 * @memberOf Nodoedocker
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
 * Returns an instance of a container
 * @method container
 * @promise
 * @memberOf Nodoedocker
 * @param {string} name name of the container you want to create
 * @param {object} opts options for creating
 * @param {boolean} [opts.delay] dont' call `container.Inspect()`
 * @returns {object} Promise -> new container
 */
Nodoecker.prototype.container = function(name, opts) {
  opts = opts || {};
  opts.host = this.host;
  opts.authStr = this.authStr;
  var container = new DockerObj(name, 'container', opts);
  if (opts.delay) {
    return Promise.resolve(container);
  } else {
    return container.Inspect();
  }
};


/**
 * Return a list of all the running containers on a docker dameon
 * @method ps
 * @promise
 * @memberOf Nodoedocker
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
Nodoecker.prototype.ps = function(params) {
  return this._list('container', params);
};

/**
 * Return a list of all the running containers on a docker dameon
 * @method images
 * @promise
 * @memberOf Nodoedocker
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
  return this._list('image', params);
};

module.exports = Nodoecker;

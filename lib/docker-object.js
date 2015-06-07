'use strict';

var bs = require('byte-size');
var draap = require('docker-remote-api-as-promised');
var debug = require('debug')('nodoecker');
var pullImage = require('./pull-image');
var history = require('./image-history');
var startContainer = require('./start-container');
var stopContainer = require('./stop-container');
var restartContainer = require('./restart-container');
var runContainer = require('./run-container');

/**
 * @class Create a new Docker Object -- either an image or a running container
 * @param {string} name The name of the image or the container
 * @param {string} type=image `image` or `container`
 * @param {object} opts options for creating the container
 * @param {string} [opts.tag] the tag you want to use
 */
function DockerObj(name, type, opts) {
  opts = opts || {};
  this.name = name;
  this._reference = name;

  for (var opt in opts) {
    if (opts.hasOwnProperty(opt)) {
      this[opt] = opts[opt];
    }
  }

  if (opts.tag) {
    this._reference = [name, opts.tag].join(':');
  }

  if (this.name.indexOf(':') > -1 && !this.tag) {
    this._reference = this.name;
    this.name = this._reference.split(':')[0];
    this.tag = this._reference.split(':')[1];
  }

  this.type = type || 'image';
  this._history = [];

  // internal properties we keep from being serialized into the JSON repr
  this._dockerURI = [this.type, 's'].join('');
  this._host = opts.host;
  this._authStr = opts.authStr;
  this._dkr = draap(this._host);
  this._size = 0;
  this._virtualSize = 0;
  this._created = new Date();

  // make these nice to read
  Object.defineProperty(this, 'size', {
    get: function() {
      return bs(this._size);
    },
    set: function(size) {
      this._size = size;
    }
  });

  Object.defineProperty(this, 'virtualSize', {
    get: function() {
      return bs(this._virtualSize);
    },
    set: function(size) {
      this._virtualSize = size;
    }
  });

  Object.defineProperty(this, 'created', {
    get: function() {
      return this._created.toISOString();
    },
    set: function(date) {
      this._created = new Date(date);
    }
  });

  // we'll attach the specific methods each one needs here
  if (this.type === 'image') {
    this.pull = pullImage;
    this.history = history;
    this.run = runContainer;
  } else {
    this.start = startContainer;
    this.stop = stopContainer;
    this.restart = restartContainer;
  }
}

/**
 * Inspect the current object
 * @method Inspect
 * @memberOf DockerObj
 * @promise
 */
DockerObj.prototype.Inspect = function() {
  debug('inspecting image');
  var imgUrl = this._makeUri('json');
  return this._dkr.get(imgUrl, {json: true})
    .bind(this)
    .then(function(info) {
      for (var prop in info) {
        if (info.hasOwnProperty(prop)) {
          this[prop] = info[prop];
        }
      }
      debug('image inspected');
      return this;
    })
    .catch(function(err) {
      debug('docker daemon error', err);
      throw err;
    });
};

/**
 * Delete an image or a container
 * @method delete
 * @promise
 */
DockerObj.prototype.delete = function() {
  debug('deleting', this.type);
  var deleteUrl = this._makeUri();
  return this.dkr.delete(deleteUrl);
};

/**
 * Generate URLs in one place to make it easier for everyone
 * @method _makeUri
 * @param {...string} arguments any number of strings to be joined with '/'
 * @returns {string} The generated URI for docker
 */
DockerObj.prototype._makeUri = function() {
  var args = Array.prototype.slice.call(arguments);
  return ['', this._dockerURI, this._reference].concat(args).join('/');
};

/**
 * Make a nice version of this to serialize to disk
 * @method toJSON
 * @returns {object} cleaned up `this`
 */
DockerObj.prototype.toJSON = function() {
  var ret = {};
  for (var prop in this) {
    if (this.hasOwnProperty(prop) && typeof this[prop] !== 'function' && prop[0] !== '_') {
      ret[prop] = this[prop];
    }
  }
  return ret;
};

module.exports = DockerObj;

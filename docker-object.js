'use strict';

var bs = require('byte-size');
var draap = require('docker-remote-api-as-promised');
var debug = require('debug')('nodoecker');

function DockerObj(name, type, opts) {
  this.name = name;
  this._reference = name;
  if (opts.tag) {
    this.tag = opts.tag;
    this._reference = [name, opts.tag].join(':');
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
}

DockerObj.prototype.history = function() {
    var url = '/' + this._dockerURI + '/' + this.id + '/history';

    if (this._history.length > 0) {
      return Promise.resolve(this._history);
    }

    return this._dkr.get(url, {json: true})
      .bind(this)
      .then(function(history) {
        this._history = history;
        return this._history;
      })
      .catch(function(err) {
        return err;
      });
};

DockerObj.prototype.Inspect = function() {
    var imgUrl = '/' + this._dockerURI + '/' + this._reference + '/json';
    debug('Creating new', this._dockerURI, 'with', imgUrl);
    return this._dkr.get(imgUrl, {json: true})
      .bind(this)
      .then(function(info) {
        debug('Finished getting image');
        this.architecture = info.Architecture;
        this.size = info.Size;
        this.virtualSize = info.VirtualSize;
        this.created = info.Created;
        this.id = info.Id;
        this.parentId = info.ParentId;
        this.repoTags = info.RepoTags;
        this.container = info.Container;
        this.containerConfig = info.ContainerConfig;
        this.os = info.Os;
        this.dockerVersion = info.DockerVersion;
        this.config = info.Config;
        return this;
      })
      .catch(function(err) {
        return err;
      });
};

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

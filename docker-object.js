'use strict';

var bs = require('byte-size');
var draap = require('docker-remote-api-as-promised');
var debug = require('debug')('nodoecker');

function DockerObj(name, type, opts) {
  if (opts.tag) {
    name = [name, opts.tag].join(':');
  }

  this.type = type || 'image';
  this._dockerURI = [this.type, 's'].join('');

  this.reference = name;
  this.host = opts.host;
  this.authStr = opts.authStr;
  this.dkr = draap(this.host);
  this.history = [];
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

Image.prototype.history = function() {
    var url = '/' + this._dockerURI + '/' + this.id + '/history';
    return this.dkr.get(url, {json: true})
      .bind(this)
      .then(function(history) {
        this.history = history;
        return this;
      })
      .catch(function(err) {
        return err;
      });
};

Image.prototype.Inspect = function() {
    var imgUrl = '/' + this._dockerURI + '/' + this.reference + '/json';
    debug('Creating new', this._dockerURI, 'with', imgUrl);
    return this.dkr.get(imgUrl, {json: true})
      .bind(this)
      .then(function(info) {
        debug('Finished getting image');
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

module.exports = DockerObj;

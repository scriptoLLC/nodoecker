'use strict';

var bs = require('byte-size');
var Promise = require('native-or-bluebird');
var Dr = require('docker-remote-api');
var debug = require('debug')('nodoecker');

function Image(name, opts) {
  if (opts.tag) {
    name = [name, opts.tag].join(':');
  }

  this.reference = name
  this.host = opts.host;
  this.authStr = opts.authStr;
  this.dkr = new Dr({host: this.host});
  this.history = [];
  this._size = 0;
  this._virtualSize = 0;
  this._created = new Date();
  var self = this;

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
  var self = this;
  return new Promise(function(resolve, reject) {
    var url = '/images/' + self.id + '/history';
    this.dkr.get(url, function(err, stream) {
      if (err) {
        return reject(err);
      }

      var data = [];

      stream
        .on('data', function(chunk) {
          data.push(chunk.toString());
        })
        .on('end', function() {
          var history = JSON.parse(data.join(''));
          self.history = history;
          resolve(self);
        });
    });
  });
};

Image.prototype.Inspect = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var imgUrl = '/images/' + self.reference + '/json';
    debug('Creating new image with', imgUrl);
    self.dkr.get(imgUrl, function(err, stream) {
      if (err) {
        debug('Docker returned an error', err);
        return reject(err);
      }

      var data = [];
      stream.on('data', function(chunk) {
          data.push(chunk.toString());
        }).on('end', function() {
          debug('Finished getting image');
          var info = JSON.parse(data.join(''));
          self._size = info.Size;
          self._virtualSize = info.VirtualSize;
          self._created = new Date(info.Created);
          self.id = info.Id;
          self.parentId = info.ParentId;
          self.repoTags = info.RepoTags;
          self.container = info.Container;
          self.containerConfig = info.ContainerConfig;
          self.os = info.Os;
          self.dockerVersion = info.DockerVersion;
          self.config = info.Config;
          resolve(self);
        });
    });
  });
};

module.exports = Image;

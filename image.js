'use strict';

var bs = require('byte-size');
var Promise = require('bluebird');

function Image(name, opts) {
  this.reference = name;
  this.dkr = opts.dkr;
  this.history = [];
  this._size = 0;
  this._virtualSize = 0;
  this._created = new Date();

  Object.defineProperty(this, 'size', {
    get: function(humanize) {
      if (humanize) {
        return bs(this._size);
      }
      return this._size;
    }
  });

  Object.defineProperty(this, 'virtualSize', {
    get: function(humanize) {
      if (humanize) {
        return bs(this._virtualSize);
      }
      return this._virtualSize;
    }
  });

  Object.defineProperty(this, 'created', {
    get: function(humanize) {
      if (humanize) {
        return this._created.toISOString();
      }
      return this._created;
    }
  });

  if (!opts.delay) {
    this.ready = this.inspect();
    return;
  }

  this.ready = Promise.resolve();
}

Image.prototype.history = Promise.method(function() {
  var url = '/images/' + self.id + '/history';
  this.dkr.getAsync(url, {json: true})
    .bind(this)
    .then(function(history){
      this.history = history;
      return this;
    });
});

Image.prototype.inspect = Promise.method(function() {
  var url = '/images/' + this.reference + '/json';
  this.dkr.getAsync(url, {json: true})
    .bind(this)
    .then(function(info) {
      this._size = info.Size;
      this._virtualSize = info.VirtualSize;
      this._created = new Date(info.Created);
      this.id = info.Id;
      this.parentId = info.ParentId;
      this.repoTags = info.RepoTags;
      this.container = info.Container;
      this.containerConfig = info.ContainerConfig;
      this.os = info.Os;
      this.dockerVersion = info.DockerVersion;
      this.config = info.Config;
      return this;
    });
});

Image.prototype.tag = function() {

};

module.exports = Image;

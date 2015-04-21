'use strict';

var bs = require('byte-size');
var Promise = require('native-or-bluebird');

function Image(container, dkr, inspect) {
  this._size = container.Size;
  this._virtualSize = container.VirtualSize;
  this._created = new Date(container.Created);
  this.id = container.Id;
  this.parentId = container.ParentId;
  this.repoTags = container.RepoTags;
  this.dkr = dkr;
  this.history = [];

  if (inspect) {
    this.ready = this.inspect();
  }

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
}

Image.prototype.history = function() {
  var self = this;
  return new Promise(function(reject, resolve) {
    var url = '/images/' + self.id + '/history';

    self.dkr.get(url, function(err, history) {
      if (err) {
        reject(err);
      }

      self.history = history;
      resolve(history);
    });
  });
};

Image.prototype.inspect = function() {
  var self = this;
  return new Promise(function(reject, resolve) {
    var url = '/images/' + self.id + '/json';

    self.dkr.get(url, function(err, info) {
      if (err) {
        reject(err);
      }

      if (!self._created) {
        self._created = new Date(info.Created);
      }

      if (!self._size) {
        self._size = info.Size;
      }

      if (!self.parentId) {
        self.parentId = info.Parent;
      }

      self.config = info.ContainerConfig;
      resolve(info.ContainerConfig);
    });
  });
};

Image.prototype.tag = function() {

};

module.exports = Image;

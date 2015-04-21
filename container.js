'use strict';

var bs = require('byte-size');

function Container(container) {
  var size = container.Size;
  var virtualSize = container.VirtualSize;
  this.id = container.Id;
  this.parentId = container.ParentId;
  this.repoTags = container.RepoTags;

  Object.defineProperty(this, 'size', {
    get: function(humanize) {
      if (humanize) {
        return bs(size);
      }
      return size;
    },
    set: function(value) {
      size = value;
    }
  });

  Object.defineProperty(this, 'virtualSize', {
    get: function(humanize) {
      if (humanize) {
        return bs(virtualSize);
      }
      return virtualSize;
    },
    set: function(value) {
      virtualSize = value;
    }
  });
}




module.exports = Container;

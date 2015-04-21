'use strict';

var dr = require('docker-remote-api');
var docker;

module.exports = function(host) {
  if (!docker) {
    docker = this.dkr = dr({host: host});
  }
  return docker;
};

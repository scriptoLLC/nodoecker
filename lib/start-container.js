'use strict';

/**
 * Starts a container
 * @method start
 * @memberOf DockerObject
 * @param {number} [time=0] Amount of time to delay starting the container
 * @returns {Promise} Resolve -> `true`
 */
module.exports = function start(time) {
  time = parseInt(time, 10) || 0;
  var containerUrl = this._makeUri('start');

  return this.dkr
    .post(containerUrl)
    .then(function() {
      return true;
    })
    .catch(function(err) {
      throw err;
    });
};

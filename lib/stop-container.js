'use strict';

/**
 * Stops a container
 * @method stop
 * @memberOf DockerObject
 * @param {number} [time=0] amount of time to wait before stopping container
 * @returns {Promise} resolve -> `true`
 */
module.exports = function stop(time) {
  time = parseInt(time, 10) || 0;
  var containerUrl = this._makeUri('stop');

  return this.dkr
    .post(containerUrl)
    .then(function() {
      return true;
    })
    .catch(function(err) {
      throw err;
    });
};

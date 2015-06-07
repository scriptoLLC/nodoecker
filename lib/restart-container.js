'use strict';

/**
 * Restarts a container
 * @method restart
 * @memberOf  DockerObject
 * @param {number} [time=0] amount of time to delay restart
 * @returns {Promise} Resolve -> `true`
 */
module.exports = function restart(time) {
  time = parseInt(time, 10) || 0;
  var containerUrl = this._makeUri('restart');

  return this.dkr
    .post(containerUrl)
    .then(function() {
      return true;
    })
    .catch(function(err) {
      throw err;
    });
};

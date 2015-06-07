'use strict';

var Promise = require('native-or-bluebird');


/**
 * Get the history for this object
 * @method history
 * @memberOf DockerObj
 * @promise
 * @returns {array} List of description objects
 */
module.exports = function history() {
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
      throw err;
    });
};

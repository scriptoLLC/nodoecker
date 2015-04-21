'use strict';

var dr = require('docker-remote-api');
var xtend = require('xtend');
var Promise = require('native-or-bluebird');

var Container = require('./container');

var dockerRegistry = 'https://index.docker.io/v1';


/**
 * Create a new instance of Nodöcker
 * @class
 * @param {string} host the docker host or socket
 * @param {object} auth an AuthConfig object
 * @param {string} [auth.username] username to use for authed queries
 * @param {string} [auth.passwod] password to use for authed queries
 * @param {string} [auth.serveraddress=https://index.docker.io/v1] the registry
 * @param {string} auth.email your email address
 */
function Nodoecker(host, auth){
  this.dkr = dr({host: host});
  this.authStr = this._makeAuth(auth);
}

/**
 * Create a base64 auth string from an AuthConfig object
 * @memberOf Nodoecker
 * @method _makeAuth
 * @private
 * @param {object} auth AuthConfig object
 * @returns {string} base64 encoded JSON.stringify'ed representation of AuthConfig
 */
Nodoecker.prototype._makeAuth = function(auth){
  var a = {
    username: auth.username || '',
    password: auth.password || '',
    serveraddress: auth.serveraddress || dockerRegistry,
    email: auth.email
  };

  return new Buffer(JSON.stringify(a)).toString('base64');
};

/**
 * Create a new container on the docker server
 * @method run
 * @promise
 * @param {object} details details about the container to launch. Details: https://docs.docker.com/reference/api/docker_remote_api_v1.17/#create-a-container
 * @param {string} name what to name the container
 * @returns {container} the container will be returned to the promise
 */
Nodoecker.prototype.run = function(details, name) {
  return new Promise(function(resolve, reject) {
    if (!/^\/?[a-zA-Z0-9_-]+/.test(name)) {
      throw new Error('Name can only consist of characters a-z, A-Z, 0-9, _ and -');
    }

    var defaultDetails = {
      Hostname: "",
      Domainname: "",
      User: "",
      Memory: 0,
      MemorySwap: 0,
      CpuShares: 512,
      Cpuset: "0,1",
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
      Env: null,
      Cmd: [],
      Entrypoint: "",
      Image: "",
      Volumes: {},
      WorkingDir: "",
      NetworkDisabled: false,
      ExposedPorts: {},
      SecurityOpts: [""],
      HostConfig: {
        Binds: [],
        Links: [],
        LxcConf: {},
        PortBindings: {},
        PublishAllPorts: false,
        Privileged: false,
        ReadonlyRootfs: false,
        Dns: [],
        DnsSearch: [""],
        ExtraHosts: null,
        VolumesFrom: [],
        CapAdd: [],
        Capdrop: [],
        RestartPolicy: {"Name": "", "MaximumRetryCount": 0},
        NetworkMode: "bridge",
        Devices: []
      }
    };

    details = xtend(defaultDetails, details);

    var opts = {
      qs: {name: name},
      json: true
    };

    var req = this.dkr.post('/containers/create', opts, function(err, resp){
      if (err) {
        reject(err);
      }

      resolve(new Container(xtend(resp, details)));
    });

    req.send(details);
  });
};

/**
 * List all containers in docker instance
 * @method ps
 * @memberOf Nodoedocker
 * @promise
 * @param {object} params parameters for sorting/filtering
 * @param {boolean} [params.all=false] true = show all containers, false = show only running
 * @param {string} [params.limit] show only x number of last created containers, including non-running
 * @param {string} [params.since] show only containers created since container id
 * @param {string} [params.before] show only containers created before container id
 * @param {boolean} [params.size=false] show the container sizes
 * @param {object} [params.filters] a set of filters to apply to the response
 * @param {integer} [params.filters.exited] list containers with the specified exit code
 * @param {string} [params.filters.status] list containers with status: restarting, running, paused, exiting
 * @returns {container[]} an array of container objects when the promise fulfills
 */
Nodoecker.prototype.ps = function(params) {
  params = params || {};

  if (params.filters) {
    params.filters = JSON.stringify(params.filters);
  }

  var opts = {
    qs: params,
    json: true
  };

  var prms = new Promise(function(resolve, reject){
    this.dkr.get('/images/json', opts, function(err, response) {
      if(err) {
        return reject(err);
      }
      var containers = response.map(function(container){
        return new Container(container);
      });

      resolve(containers);
    });
  });

  return prms;
};

module.exports = Nodoecker;

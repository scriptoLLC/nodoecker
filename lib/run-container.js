'use strict';

var xtend = require('xtend');
var DockerObj = require('./docker-object');

/**
 * Inspect an image (pulling it from a registry if necessary), create a new
 * container based on that image, and then run that container, returning
 * the container
 * @method run
 * @promise
 * @param {string} name what to name the container
 * @param {object} details details about the container to launch. Details: https://docs.docker.com/reference/api/docker_remote_api_v1.17/#create-a-container
 * @returns {Promise} resolves to a new container
 */
module.exports = function run(name, details) {
  details = details || {};
  if (!/^\/?[a-zA-Z0-9_-]+/.test(name)) {
    throw new Error('Name can only consist of characters a-z, A-Z, 0-9, _ and -');
  }

  return this.Inspect()
    .bind(this)
    .then(function(img) {
      return img;
    }, function() {
      return this.pull();
    })
    .then(function(img) {
      var defaultDetails = {
        Hostname: "",
        Domainname: "",
        User: "",
        Memory: 0,
        MemorySwap: 0,
        CpuShares: 0,
        Cpuset: "",
        AttachStdin: false,
        AttachStdout: false,
        AttachStderr: false,
        Tty: false,
        OpenStdin: false,
        StdinOnce: false,
        Env: null,
        Cmd: "",
        Entrypoint: "",
        Image: img.Id,
        Volumes: {},
        WorkingDir: "",
        NetworkDisabled: false,
        ExposedPorts: img.Config.ExposedPorts,
        SecurityOpts: [""],
        "HostConfig": {
          "Binds": null,
          "CapAdd": null,
          "CapDrop": null,
          "ContainerIDFile": "",
          "Devices": [],
          "Dns": null,
          "DnsSearch": null,
          "ExtraHosts": null,
          "IpcMode": "",
          "Links": null,
          "LxcConf": [],
          "NetworkMode": "bridge",
          "PidMode": "",
          "PortBindings": {},
          "Privileged": false,
          "PublishAllPorts": false,
          "ReadonlyRootfs": false,
          "RestartPolicy": {
              "MaximumRetryCount": 0,
              "Name": ""
          },
          "SecurityOpt": null,
          "VolumesFrom": null
        }
      };

      details = xtend(defaultDetails, details);

      var opts = {
        qs: {name: name},
        body: JSON.stringify(details),
        json: true,
        headers: {
          'content-type': 'application/json'
        }
      };

      return this.dkr
        .post('/containers/create', opts)
        .bind(this)
        .then(function(container) {
          container.name = name;
          var instance = new DockerObj(name, 'container', container);
          return instance.start();
        })
        .catch(function(err) {
          throw err;
        });
  });
};

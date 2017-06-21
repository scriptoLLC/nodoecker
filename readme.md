[![Circle CI](https://circleci.com/gh/scriptoLLC/nodoecker.svg?style=svg)](https://circleci.com/gh/scriptoLLC/nodoecker)

# Nodöcker (nodoecker)

[![Greenkeeper badge](https://badges.greenkeeper.io/scriptoLLC/nodoecker.svg)](https://greenkeeper.io/)
A node/docker API designed to mimic the UI from the Docker CLI as much as possible. The Docker REST API doesn't map very clearly, and if you have experience with using the CLI, you're going to be spend a lot of time reading the API docs to figure out how to do the same things. This attempts to fix that.

And yes it uses promises. This was designed to work with [Koa](https://github.com/koajs/koa) so it's promises. But it will use the built-in `Promise` object
if it exists. And [bluebird](https://npmjs.org/package/bluebird) if not.

Don't like promises? Perhaps you should read ["We have a problem with promises"](http://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html).

## Install

```sh
npm i -S nodoecker
```

## Usage

```js
var Nodeocker = require('nodeocker');
// If you are working with private images, you can login to the docker registry
// by passing the following object into the constructor
var authObj = {
  username: 'test',
  password: 'test',
  email: 'test@example.com'
};
var nd = new Nodeocker('/var/run/docker.sock', authObj);
nd
  .pull('busybox:latest')
  .then(function(busybox) {
    return busybox.Inspect();
  })
  .then(function(busybox) {
    console.log(busybox.size);
    return nd.run('myBusybox', 'busybox');
  })
  .then(function(myBusybox) {
    return myBusybox.Inspect();
  })
  .then(function(myBusybox) {
    console.log(myBusybox.Cmd[0]);
    console.log(myBuxbox.ExposedPorts);
  })
  .catch(function(err) {
    console.log('O NOES', err);
  });
```

## Implemented API
It only implements a portion subset of the Docker API current:

* Pulling images [`docker pull`]
* Creating containers [`docker run`]
* Stopping containers [`docker stop`]
* Restarting containers [`docker restart`]
* Inspecting containers and images [`docker inspect`]
* Getting image history [`docker history`]
* Listing all images available [`docker images`]
* Listing all running containers [`docker ps`]

Pull-Requests to implement more of the API or to provide better alignment against the CLI versus the exposed parts of the API are very welcome!

## Tests

```
npm test
```

It will attempt to talk to Docker via `/var/run/docker.sock`. If your Docker
daemon is running in a different place you can specify it by setting the `DOCKER_SOCK` environment variable.

```
DOCKER_SOCK=http://127.0.0.1:9000 npm test
```

## Licenese
Apache 2.0; Copyright &copy; 2015 Scripto
# Nodöcker (nodoecker)
A node/docker API designed to mimic the UI from the Docker CLI as much as possible.

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

## Issues!
It only implements a very small subset of the Docker API current:

* Pulling images [docker pull]
* Creating containers [docker run]
* Inspecting containers and images [docker inspect]

## Licenese
Apache 2.0; Copyright 2015 Scripto
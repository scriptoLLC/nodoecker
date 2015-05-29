'use strict';

var test = require('tap').test;
var ND = require('./');

var nd = new ND(process.env.DOCKER_SOCK || '/var/run/docker.sock');

test('pulling an image', function(t) {
  t.plan(3);
  nd
    .pull('hello-world')
    .then(function(img) {
      t.equal(img.type, 'image', 'got an image back');
      t.equal(img.name, 'hello-world', 'name is present');
      t.notOk(/_/.test(JSON.stringify(img)), 'no underscores');
    })
    .catch(function(err) {
      t.notOk(!!err, err.message);
    });
});

test('pulling an image with a specific tag', function(t) {
  t.plan(2);
  var tag = 'latest';
  nd
    .pull('hello-world:' + tag)
    .then(function(img) {
        t.equal(img.tag, tag, 'tag pulled');
        t.equal(img._reference, 'hello-world:' + tag, 'reference is right');
      })
      .catch(function(err) {
        t.notOk(!!err, err.message);
      });
});

test('inspecting an image', function(t) {
  t.plan(2);
  nd
    .image('hello-world')
    .then(function(img) {
      t.equal(img.architecture, 'amd64', 'arch');
      t.equal(img.virtualSize, '910 B', 'virtual size');
    })
    .catch(function(err) {
      t.notOk(!!err, err.message);
    });
});

test('image inspection & history', function(t) {
  t.plan(1);
  nd
    .image('hello-world')
    .then(function(img) {
      return img.history();
    })
    .then(function(history) {
      t.notEqual(history.length, 0, 'there is a history');
    })
    .catch(function(err) {
      t.notOk(!!err, err.message);
    });
});


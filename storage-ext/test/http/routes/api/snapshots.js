"use strict";

var assert = require("assert");
var async = require("async");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var each = require('underscore').each;

var Project = require('../../../../lib/project');
var Snapshot = require('../../../../lib/snapshot');

var owner = '810ffb30-1938-11e6-a132-dd99bc746800';

describeAppTest("http", function (app) {
  describe('api snapshot routes', function () {
    this.timeout(15000);

    var projectId = 'project-fe5b5340-8991-11e6-b86a-b5fa2a5eb9ca';
    var projectUUID = null;

    var snapshotUUID0 = null;

    before(function (done) {
      request(app.proxy)
        .post('/api/projects')
        .send({
          owner: owner,
          id: projectId,
          data: {
            foo: "bar",
            yes: "no",
            counts: {
              "1": 10,
              "2": 47,
            },
          },
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.notEqual(res.body.uuid, null);
          projectUUID = res.body.uuid;
          done();
        });
    });

    after(function (done) {
      async.series([
        function (cb) {
          Snapshot.destroy({
            where: {
              owner: owner,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' snapshots');
            cb();
          }).catch(function (err) {
            console.error('snapshot cleanup error', err);
            cb(err);
          });
        },
        function (cb) {
          Project.destroy({
            where: {
              uuid: projectUUID,
            },
          }).then(function (numDeleted) {
            console.log('deleted ' + numDeleted + ' projects');
            cb();
          }).catch(function (err) {
            console.error('project cleanup error', err);
            cb(err);
          });
        },
      ], function (err) {
        assert.ifError(err);
        done();
      });
    });

    it('should create a snapshot', function createSnapshot(done) {
      request(app.proxy)
        .post('/api/snapshots')
        .send({
          owner: owner,
          projectId: projectId,
          projectVersion: 0,
          message: "test snapshot",
          tags: {
            test: true,
            hello: "kitty",
            stuff: ["bing", "bang", "bong"],
          },
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.notEqual(res.body.uuid, null);
          snapshotUUID0 = res.body.uuid;
          console.log(res.body);
          done();
        });
    });

    it('should fetch a snaphost using UUID', function fetchByUUID(done) {
      request(app.proxy)
        .get('/api/snapshots/uuid/' + snapshotUUID0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          assert.equal(res.body.uuid, snapshotUUID0);
          console.log(res.body);
          done();
        });
    });
  });
});
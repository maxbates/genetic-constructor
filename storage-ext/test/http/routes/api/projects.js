"use strict";

var assert = require("assert");
var async = require("async");
var urlSafeBase64 = require("urlsafe-base64");
var request = require("supertest");
var describeAppTest = require("../../../api-app");

var Project = require('../../../../lib/project');

var owner = '810ffb30-1938-11e6-a132-dd99bc746800';

describeAppTest("http", function (app) {
  describe('api project routes', function () {
    this.timeout(15000);

    var projectId0 = 'b091da207742e81dae58257a323e3d3b';

    after(function (done) {
      Project.destroy({
        where: {
          owner: owner,
        },
      }).then(function (numDeleted) {
        console.log('deleted ' + numDeleted + ' projects');
        done();
      }).catch(function (err) {
        console.error('project cleanup error', err);
        done(err);
      });
    });

    it('should save a new project', function saveNewProject(done) {

      var data = {
        chicago: 'blackhawks',
      };

      request(app.proxy)
        .post('/api/projects')
        .send({
          owner: owner,
          id: projectId0,
          data: data,
        })
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('save res:', res.body);
          assert.notEqual(res.body.uuid, null);
          assert.equal(res.body.owner, owner);
          assert.equal(res.body.version, 0);
          assert.equal(res.body.status, 1);
          assert.equal(res.body.id, projectId0);
          assert.deepEqual(res.body.data, data);
          assert.notEqual(res.body.createdAt, null);
          assert.notEqual(res.body.updatedAt, null);
          done();
        });
    });

    it('should fetch the latest project version by \'id\'', function fetchLatestProjectVersion(done) {
      request(app.proxy)
        .get('/api/projects/' + projectId0)
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by project id result:', res.body);
          // TODO make sure we actually got the latest version when we have multiple versions
          done();
        });
    });

    it('should fetch projects by \'ownerId\'', function fetchProjectsByOwnerId(done) {
      var buffer = new Buffer(owner, 'utf8');
      request(app.proxy)
        .get('/api/projects/owner/' + urlSafeBase64.encode(buffer))
        .expect(200)
        .end(function (err, res) {
          assert.ifError(err);
          assert.notEqual(res, null);
          assert.notEqual(res.body, null);
          // console.log('fetch by owner result:', res.body);
          assert(Array.isArray(res.body));
          done();
        });
    });

  });
});

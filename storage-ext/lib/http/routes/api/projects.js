"use strict";

var async = require('async');

var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;

var urlSafeBase64 = require("urlsafe-base64");
var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;


var Project = require('../../../project');

var saveProject = function (req, res) {
  var body = req.body;
  if (! body) {
    return res.status(400).send({
      message: 'request body required to save new project',
    }).end();
  }

  if (! body.owner) {
   return res.status(400).send({
     message: '\'owner\' is required in request body',
   }).end();
  }

  if (! uuidValidate(body.owner, 1)) {
    return res.status(400).send({
      message: '\'owner\' UUID is invalid',
    }).end();
  }

  if (! body.id) {
    return res.status(400).send({
      message: '\'id\' is required in request body',
    }).end();
  }

  if ((! body.data) || isEmpty(body.data)) {
    return res.status(400).send({
      message: '\'data\' is required in request body',
    }).end();
  }

  return Project.create({
    owner: body.owner,
    id: body.id,
    data: body.data,
  }).then(function (newProject) {
    return res.status(200).send(newProject.get()).end();
  }).catch(function (err) {
    console.log(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var updateProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  if (! req.body) {
    return res.status(400).send({
      message: 'no request body for updating project',
    }).end();
  }

  var data = req.body.data;
  if (! data) {
    return res.status(400).send({
      message: 'no data in request body for updating project',
    }).end();
  }

  // just do an update if the caller gave owner and version
  var owner = req.headers['gctor-project-owner'];
  var version = req.headers['gctor-project-version'];
  if (notNullOrEmpty(owner) && notNullAndPosInt(version) && uuidValidate(owner, 1)) {
    return Project.update({
      data: data,
    }, {
      returning: true,
      fields: ['data'],
      where: {
        id: projectId,
        owner: owner,
        version: version,
      }
    }).then(function (results) {
      console.log(results);
      res.status(200).send({
        message: 'success',
      }).end();
    }).catch(function (err) {
      console.error(err);
      res.status(500).send({
        id: 'boombastic',
      }).end();
    });
  }

  // TODO handle just a projectId and data
  return res.status(200).send({
    id: projectId,
    data: data,
  }).end();
};

var fetchLatestProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  return Project.findAll({
    where: {
      id: projectId,
    }
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'projectId ' + projectId + ' does not exist',
      }).end();
    }

    var latest = max(results, function (row) {
      return row.get('version');
    });
    return res.status(200).send(latest.get()).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjects = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  var uuidBuf = urlSafeBase64.decode(ownerUUID);
  var owner = uuidBuf.toString('utf8');

  return Project.findAll({
    where: {
      owner: owner,
    }
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no projects found for owner: ' + owner,
      }).end();
    }

    return res.status(200).send(map(results, function (row) { return row.get(); })).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var routes = [
  route('GET /:projectId', fetchLatestProject),
  route('POST /:projectId', updateProject),
  route('GET /owner/:ownerId', fetchProjects),
  route('POST /', saveProject),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("PROJECTS!");
  }),
];

module.exports = combiner.apply(null, routes);

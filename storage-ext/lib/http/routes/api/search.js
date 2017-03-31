"use strict";

var async = require('async');

var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;
var omit = require('underscore').omit;
var reduce = require('underscore').reduce;

var urlSafeBase64 = require('urlsafe-base64');
var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;

var Sequelize = require('sequelize');
var Project = require('../../../project');
var Order = require('../../../order');
var Snapshot = require('../../../snapshot');

function collapseProjectsToUUIDs(projectsArray) {
  var groupedProjects = groupBy(projectsArray, function (project) {
    return project.id;
  });

  return map(pairs(groupedProjects), function (pair) {
    return max(pair[1], function (projObj) {
      return projObj.version;
    }).uuid;
  });
}

var searchProjectName = function (req, res) {
  var encodedNameQuery = req.params.nameQuery;
  if ((! encodedNameQuery) || (encodedNameQuery == "")) {
    return res.status(400).send({
      message: 'failed to parse encoded project name query from URI',
    }).end();
  }

  if (! urlSafeBase64.validate(encodedNameQuery)) {
    return res.status(400).send({
      message: 'invalid encoded project name query',
    }).end();
  }

  var nameQuery = urlSafeBase64.decode(encodedNameQuery).toString('utf8');
  if ((!nameQuery) || (nameQuery == "")) {
    return res.status(400).send({
      message: 'decoding failure of encoded project name query',
    }).end();
  }

  nameQuery = '%' + nameQuery + '%';

  var where = {
    status: 1,
    data: {
      project: {
        metadata: {
          name: {
            $like: nameQuery,
          }
        }
      }
    }
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findAll({
    where: where,
    attributes: ['uuid', 'id', 'version'],
  }).then(function (results) {
    if (results.length < 1) {
      var msg = 'no projects found with name matching: ' + nameQuery;
      if (where.owner != null) {
        msg = msg + ' and ownerId: ' + where.owner;
      }
      return res.status(404).send({
        message: msg,
      }).end();
    }

    return res.status(200).send(collapseProjectsToUUIDs(results)).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectList = function (req, res) {
  var projectUUIDs = req.body;
  if(! projectUUIDs || ! Array.isArray(projectUUIDs)) {
    return res.status(400).send({
      message: 'request body required; POST JSON array of project UUIDs',
    }).end();
  }

  const includeBlocks = (req.query.blocks && (req.query.blocks.toLowerCase() === 'true'));

  return async.map(projectUUIDs, function (projectUUID, cbFunc) {
    return Project.findOne({
      where: {
        uuid: projectUUID,
        status: 1,
      },
    }).then(function (result) {
      if (! result) {
        return cbFunc();
      }

      if (includeBlocks) {
        return cbFunc(null, result.get())
      }

      var loadedResult = result.get();
      loadedResult.data = omit(loadedResult.data, 'blocks');

      return cbFunc(null, loadedResult);
    }).catch(function (err) {
      req.log.error(err);
      return cbFunc(err);
    });
  }, function (err, results) {
    if (err) {
      return res.status(500).send({
        message: err.message,
      }).end();
    }

    return res.status(200).send(results).end();
  });
};

var routes = [
  route('GET /projects/name/:nameQuery', searchProjectName),
  route('POST /projects/list', fetchProjectList),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("SEARCH!");
  }),
];

module.exports = combiner.apply(null, routes);

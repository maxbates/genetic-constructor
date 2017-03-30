"use strict";

var async = require('async');

var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;
var omit = require('underscore').omit;
var reduce = require('underscore').reduce;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;

var Sequelize = require('sequelize');
var Project = require('../../../project');
var Order = require('../../../order');
var Snapshot = require('../../../snapshot');


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
  route('POST /projects/list', fetchProjectList),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("SEARCH!");
  }),
];

module.exports = combiner.apply(null, routes);
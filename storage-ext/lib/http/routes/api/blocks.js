"use strict";

var async = require('async');

var objectPath = require("object-path");

var filter = require('underscore').filter;
var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;
var omit = require('underscore').omit;
var reduce = require('underscore').reduce;
var values = require('underscore').values;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');

var Project = require('../../../project');

var FILTERS = {
  name: function (blocksArray, filterValue) {
    return filter(blocksArray, function (blockObj) {
      return (objectPath.get(blockObj, 'metadata.name') === filterValue);
    });
  },
  role: function (blocksArray, filterValue) {
    return filter(blocksArray, function (blockObj) {
      return (objectPath.get(blockObj, 'rules.role') === filterValue);
    });
  },
};

function applyBlockFilter(blocks, filterField, filterValue) {
  var filter = FILTERS[filterField];
  if (! filter) {
    console.error('unrecognized filter field:', filterField);
    return blocks;
  }

  return filter(blocks, filterValue);
}

function collapseBlocks(projectsArray, filterField, filterValue) {
  var groupedProjects = groupBy(map(projectsArray, function (row) {
    var projectJson = row.get();
    var matchingBlocks = applyBlockFilter(values(projectJson.data.blocks), filterField, filterValue);
    return {
      id: projectJson.id,
      version: projectJson.version,
      blocks: matchingBlocks,
    };
  }), function (project) {
    return project.id;
  });

  return reduce(pairs(groupedProjects), function (memo, pair) {
    return memo.concat(max(pair[1], function (projObj) {
      return projObj.version;
    }).blocks);
  }, []);
}

var fetchBlocksByName = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  var blockName = req.params.name;
  if ((! blockName) || (blockName == "")) {
    return res.status(400).send({
      message: 'failed to parse block \'name\' from URI',
    }).end();
  }

  var where = {
    owner: ownerUUID,
    status: 1,
  };

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no blocks found for ' + JSON.stringify(where),
      }).end();
    }

    return res.status(200).send(collapseBlocks(results, 'name', blockName)).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchBlocksByRole = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  var blockRole = req.params.role;
  if ((! blockRole) || (blockRole == "")) {
    return res.status(400).send({
      message: 'failed to parse block \'role\' from URI',
    }).end();
  }

  var where = {
    owner: ownerUUID,
    status: 1,
  };

  return Project.findAll({
    where: where,
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no blocks found for ' + JSON.stringify(where),
      }).end();
    }

    return res.status(200).send(collapseBlocks(results, 'role', blockRole)).end();
  }).catch(function (err) {
    req.log.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectCountsByRole = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  if (! uuidValidate(ownerUUID, 1)) {
    return res.status(400).send({
      message: '\'ownerId\' UUID is invalid',
    }).end();
  }

  return res.status(200).send({
    owner: ownerUUID,
  }).end();
};

var routes = [
  route('GET /name/:ownerId/:name', fetchBlocksByName),
  route('GET /role/:ownerId/:role', fetchBlocksByRole),
  route('GET /role/:ownerId', fetchProjectCountsByRole),
  route('GET /', function (req, res) {
    return res.status(501).end();
  }),
];

module.exports = combiner.apply(null, routes);

#!/usr/bin/env node
"use strict";

var async = require('async');
var fs = require('fs');

var map = require('underscore').map;

// arguably this script should use the REST API
var dbInit = require('../lib/db-init');
var Project = require('../lib/project');
var Sequelize = require("sequelize");

var mostProjectsQuery = "select owner, numprojects from (select owner, count(uuid) as numprojects from projects group by owner order by numprojects desc) as foo limit 1;";

function dumpProjects () {
  async.waterfall([
    function (cb) {
      return Sequelize.query(mostProjectsQuery).spread(function (results, metadata) {
        console.log("custom query results:", results);
        console.log("custom query metadata:", metadata);
        return cb(null, "dc606c20-a085-11e6-9219-130ec77419b4");
      }).catch(cb);
    },
    function (targetOwner, cb) {
      if ((! targetOwner) || (targetOwner == "")) {
        return cb("null or empty target project owner");
      }

      return Project.findAll({
        where: {
          owner: targetOwner,
        }
      }).then(function (results) {
        if ((! results) || (results.length < 1)) {
          return cb("no projects found for target project owner: " + targetOwner);
        }

        return cb(null, {
          targetOwner: targetOwner,
          projectObjectArray: map(results, function (result) { return result.get(); }),
        });
      }).catch(cb);
    },
    function (inputs, cb) {
      if ((! inputs.targetOwner) || (inputs.targetOwner == "")) {
        return cb("null or empty target project owner");
      }

      if((! inputs.projectObjectArray) || (! Array.isArray(inputs.projectObjectArray)) ||
        (inputs.projectObjectArray.length < 1)) {
        return cb("no project objects to export");
      }

      console.log("Exporting Projects for Owner:", inputs.targetOwner);
      return fs.writeFile('gcprojects-' + inputs.targetOwner + '.json',
        JSON.stringify(inputs.projectObjectArray), 'utf8', function (err) {
          if (err) {
            return cb(err);
          }

          return cb(null, inputs.projectObjectArray.length);
        });
    },
  ], function (err, result) {
    if(err) {
      console.error(err);
      process.exit(1);
    }

    console.log("Projects Exported:", result);
    process.exit(1);
  });
}

return dbInit(dumpProjects);

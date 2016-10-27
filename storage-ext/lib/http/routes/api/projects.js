"use strict";

var async = require('async');

var groupBy = require('underscore').groupBy;
var isEmpty = require('underscore').isEmpty;
var map = require('underscore').map;
var max = require('underscore').max;
var pairs = require('underscore').pairs;

var uuidValidate = require("uuid-validate");

var route = require("http-route");
var combiner = require('../../combiner');
var notNullOrEmpty = require('../../../util').notNullOrEmpty;
var notNullAndPosInt = require('../../../util').notNullAndPosInt;

var Sequelize = require('sequelize');
var Project = require('../../../project');

function collapseProjects(projectsArray) {
  var groupedProjects = groupBy(map(projectsArray, function (row) {
    return row.get();
  }), function (project) {
    return project.id;
  });

  return map(pairs(groupedProjects), function (pair) {
    return max(pair[1], function (projObj) {
      return projObj.version;
    });
  });
}

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
  if (!projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  if (!req.body) {
    return res.status(400).send({
      message: 'no request body for updating project',
    }).end();
  }

  var data = req.body.data;
  if (!data) {
    return res.status(400).send({
      message: 'no data in request body for updating project',
    }).end();
  }

  var where = {
    id: projectId,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }
    where.owner = req.query.owner;
  }

  var version = parseInt(req.query.version);
  if (notNullAndPosInt(version)) {
    where.version = version;
    req.log.info('update specific project version');

    return Project.update({
      data: data,
    }, {
      returning: true,
      fields: ['data'],
      where: where,
    }).then(function (results) {
      if (results[0] < 1) {
        return res.status(404).send({
          message: 'found no records to update',
          params: where,
        }).end();
      }

      if (results[0] > 1) {
        req.log.error('unexpectedly updated more than one record for:', where);
        return res.status(500).send({
          message: 'unexpectedly updated more than one record',
        }).end();
      }

      return res.status(200).send(results[1][0].get()).end();
    }).catch(function (err) {
      console.error(err);
      res.status(500).send({
        message: err.message,
      }).end();
    });
  }

  var overwrite = false;
  if ((req.query.overwrite != null) && (req.query.overwrite === "true")) {
    overwrite = true;
  }

  return async.waterfall([
    function (cb) {
      Project.findAll({
        where: where,
      }).then(function (rows) {
        return cb(null, max(rows, function (row) {
          return row.get('version');
        }));
      }).catch(cb);
    },
    function (record, cb) {
      if (! record) {
        return cb({
          nonDB: true,
          statusCode: 404,
          message: 'projectId ' + projectId + ' not found',
        });
      }

      if (overwrite) {
        record.set('data', data);
        return record.save({
          returning: true,
        }).then(function (updated) {
          return cb(null, updated.get());
        }).catch(cb);
      } else {
        return Project.create({
          owner: record.get('owner'),
          id: record.get('id'),
          data: data,
          version: (record.get('version') + 1),
        }).then(function (newProject) {
          return res.status(200).send(newProject.get()).end();
        }).catch(function (err) {
          console.log(err);
          return res.status(500).send({
            message: err.message,
          }).end();
        });
      }
    },
  ], function (err, result) {
    if (err) {
      if (err.nonDB) {
        return res.status(err.statusCode).send({
          message: err.message,
        }).end();
      }

      console.error(err);
      return res.status(500).send({
        message: err.message,
      }).end();
    }

    return res.status(200).send(result).end();
  });
};

var fetchLatestProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
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

var optimizedFetchLatestProjectVersion = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var where = {
    id: projectId,
    status: 1,
  };

  if (notNullOrEmpty(req.query.owner)) {
    if (!uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }

    where.owner = req.query.owner;
  }

  return Project.findOne({
    where: where,
    order: [
      ['version', 'DESC'],
    ],
  }).then(function (result) {
    if (! result) {
      return res.status(404).send({
        message: 'projectId ' + projectId + ' does not exist',
      }).end();
    }

    return res.status(200).send(result.get()).end();
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

  return Project.findAll({
    where: {
      owner: ownerUUID,
      status: 1,
    }
  }).then(function (results) {
    if (results.length < 1) {
      return res.status(404).send({
        message: 'no projects found for owner: ' + ownerUUID,
      }).end();
    }

    return res.status(200).send(collapseProjects(results)).end();
  }).catch(function (err) {
    console.error(err);
    return res.status(500).send({
      message: err.message,
    }).end();
  });
};

var optimizedFetchProjects = function (req, res) {
  var ownerUUID = req.params.ownerId;
  if (! ownerUUID) {
    return res.status(400).send({
      message: 'failed to parse ownerId from URI',
    }).end();
  }

  return res.status(501).send('coming soon').end();
};

var deleteProject = function (req, res) {
  var projectId = req.params.projectId;
  if (! projectId) {
    return res.status(400).send({
      message: 'failed to parse projectId from URI',
    }).end();
  }

  var version = parseInt(req.query.version);
  var owner = null;
  if (notNullOrEmpty(req.query.owner)) {
    if (! uuidValidate(req.query.owner, 1)) {
      return res.status(400).send({
        message: 'invalid owner UUID',
      }).end();
    }
    owner = req.query.owner;
  }

  var where = {
    id: projectId,
  };

  if (owner != null) {
    where.owner = owner;
  }

  if (notNullAndPosInt(version)) {
    where.version = version;
  }

  return Project.update({
    status: 0,
  }, {
    returning: false,
    fields: ['status'],
    where: where,
  }).then(function (results) {
    if (results[0] < 1) {
      return res.status(404).send({
        message: 'found no records to update',
        params: where,
      }).end();
    }

    if ((where.version != null) && (results[0] > 1)) {
      req.log.error('unexpectedly deleted more than one record for:', where);
      return res.status(500).send({
        message: 'unexpectedly deleted more than one record',
      }).end();
    }

    return res.status(200).send({
      numDeleted: results[0],
    }).end();
  }).catch(function (err) {
    console.error(err);
    res.status(500).send({
      message: err.message,
    }).end();
  });
};

var fetchProjectsWithBlock = function (req, res) {
  var blockId = req.params.blockId;
  if (! blockId) {
    return res.status(400).send({
      message: 'failed to parse blockId from URI',
    }).end();
  }

  var where = {
    data: {
      '$contains': { components: [ blockId ]},
    },
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
  }).then(function (results) {
    if (results.length < 1) {
      var msg = 'no projects found with blockId: ' + blockId;
      if (where.owner != null) {
        msg = msg + ' and ownerId: ' + where.owner;
      }
      return res.status(404).send({
        message: msg,
      }).end();
    }

    return res.status(200).send(collapseProjects(results)).end();
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
  route('DELETE /:projectId', deleteProject),
  route('GET /owner/:ownerId', fetchProjects),
  route('GET /block/:blockId', fetchProjectsWithBlock),
  route('GET /fast/project/:projectId', optimizedFetchLatestProjectVersion),
  route('GET /fast/owner/:ownerId', optimizedFetchProjects),
  route('POST /', saveProject),
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("PROJECTS!");
  }),
];

module.exports = combiner.apply(null, routes);

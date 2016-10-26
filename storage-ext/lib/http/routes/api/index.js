"use strict";

var route = require("http-route");

var config = require('../../../config');
var combiner = require('../../combiner');

var routes = [
  route('/projects', require('./projects')),
  route('*', function (req, res) {
    return res.status(404).send('/api' + req.url + ' not found').end();
  }),
];

module.exports = combiner.apply(null, routes);

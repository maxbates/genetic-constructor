"use strict";

var route = require("http-route");

var config = require('../../../config');
var combiner = require('../../combiner');

var routes = [
  route('/projects', require('./projects')),
];

module.exports = combiner.apply(null, routes);

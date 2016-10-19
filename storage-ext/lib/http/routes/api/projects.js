"use strict";

var route = require("http-route");

var combiner = require('../../combiner');

var routes = [
  route('GET /', function (req, res) {
    res.statusCode = 200;
    res.send("PROJECTS!");
  })
];

module.exports = combiner.apply(null, routes);

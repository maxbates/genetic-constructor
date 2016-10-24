"use strict";

var dbInit = require('./lib/db-init');

module.exports = {
  routes: require('./lib/http/routes/api'),
  init: dbInit,
};

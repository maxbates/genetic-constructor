"use strict";

var init = require('./project').init;
module.exports = function (callback) {
  init([
    // insert other tables here

  ], function (err) {
    if (err) {
      console.log("Failed to initialize User DB", err);
      process.exit(1)
    }
    return callback();
  });
};

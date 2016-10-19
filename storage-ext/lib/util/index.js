"use strict";

module.exports = {
  getConfig: function(config, key, defaultValue) {
    if (! config) {
      return defaultValue;
    }

    if (config[key] != null) {
      return config[key];
    }

    return defaultValue;
  },
};
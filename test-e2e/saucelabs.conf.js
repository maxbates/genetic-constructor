"use strict";

module.exports = (function(settings) {
    settings.test_settings.default.username = process.env.SAUCE_USER;
    settings.test_settings.default.access_key = process.env.SAUCE_ACCESS_KEY;
    return settings;
})(require('./saucelabs.json'));

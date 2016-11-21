
var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');

module.exports = {
  'Test that app name and logo appear' : function (browser) {
    size(browser);
    homepageRegister(browser);
    browser
      .waitForElementPresent('.GlobalNav', 5000, 'expect global nav bar')
      .waitForElementPresent('.GlobalNav .GlobalNav-logo', 5000, 'expected logo')
      .waitForElementPresent('.GlobalNav .GlobalNav-appname', 5000, 'expected app name')
      .end();
  }
};

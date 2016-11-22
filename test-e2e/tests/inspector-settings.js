var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var clickAt = require('../fixtures/clickAt');

module.exports = {
  'Test settings panel in inspector' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspectorPanel(browser, 'Settings');

    browser
      .waitForElementPresent('.InspectorGroupSettings a')
      .assert.countelements('.InspectorGroupSettings a', 2)
      .end();
  }
};

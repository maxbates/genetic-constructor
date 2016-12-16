var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var clickAt = require('../fixtures/clickAt');

module.exports = {
  'Test help panel in inspector' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspectorPanel(browser, 'Help');

    browser
    .waitForElementPresent('.InspectorGroupHelp a')
    .assert.countelements('.InspectorGroupHelp .Section', 5)
    .assert.countelements('.InspectorGroupHelp a', 17)
    .end();
  }
};

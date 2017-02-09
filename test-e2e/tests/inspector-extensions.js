var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var clickText = require('../fixtures/click-element-text');


module.exports = {
  'Test extension panel in inspector' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspectorPanel(browser, 'Extensions');

    browser
    // check basic fabric of expando containing sequence viewer, which should be present by default
    .waitForElementPresent('[data-expando="Sequence Viewer"]')
    .click('[data-expando="Sequence Viewer"]')
    .waitForElementPresent('[data-expando="Sequence Viewer"] .content-dropdown', 1000, 'expect drop down to appear')
    .assert.countelements('[data-expando="Sequence Viewer"] .row', 3)

    // open the sequence viewer
    clickText(browser, "SEQUENCE VIEWER", '.ProjectDetail-closed-extension');
    browser
    .waitForElementPresent('.ExtensionView-content .viewer', 5000, 'expected sequence viewer to be present')
    // turn extension off
    .pause(2000)
    .click('[data-expando="Sequence Viewer"] .slider-switch')
    .waitForElementNotPresent('.ExtensionView-content .viewer', 5000, 'expected sequence viewer to go away')
    // back on again
    .pause(2000)
    .click('[data-expando="Sequence Viewer"] .slider-switch')
    .pause(2000)
    clickText(browser, "SEQUENCE VIEWER", '.ProjectDetail-closed-extension');

    browser
    .waitForElementPresent('.ExtensionView-content .viewer', 5000, 'expected sequence viewer to come back')
    .end();
  }
};

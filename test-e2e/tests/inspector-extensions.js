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
    .assert.countelements('[data-expando="Sequence Viewer"] .row', 3)

    // open the GSL Editor
    clickText(browser, "GSL EDITOR", '.ProjectDetail-closed-extension');
    browser
    .waitForElementPresent('.ExtensionView-content .GSLEditorLayout', 20000, 'expected GSL Editor to be present')
    // turn extension off
    .pause(2000)
    .click('[data-expando="GSL Editor"] .Switch')
    .waitForElementNotPresent('.ExtensionView-content .GSLEditorLayout', 5000, 'expected GSL Editor to go away')
    // back on again
    .pause(2000)
    .click('[data-expando="GSL Editor"] .Switch')
    .pause(2000)
    clickText(browser, "GSL EDITOR", '.ProjectDetail-closed-extension');

    browser
    .waitForElementPresent('.ExtensionView-content .GSLEditorLayout', 20000, 'expected GSL Editor to come back')
    .end();
  }
};

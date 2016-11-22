var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var clickAt = require('../fixtures/clickAt');
var clickNthBlock = require('../fixtures/click-nth-block-bounds');
var testProject = require('../fixtures/testproject');

module.exports = {
  'Test information panel in inspector' : function (browser) {
    size(browser);
    homepageRegister(browser);
    openInspectorPanel(browser, 'Information');
    testProject(browser);
    clickNthBlock(browser, '.sceneGraph', 0);
    browser
    .waitForElementPresent('.InspectorGroup')
    .assert.countelements('.InspectorGroup input.InputSimple-input', 1)
    .assert.countelements('.InspectorGroup textarea.InputSimple-input', 1)
    .assert.countelements('.InspectorGroup .Picker.ColorPicker', 1)
    .assert.countelements('.InspectorGroup .Picker.SymbolPicker', 1)
    .end();
  }
};

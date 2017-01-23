var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var testProject = require('../fixtures/testproject');

module.exports = {
  'Open the color picker on a block': function (browser) {
    size(browser);
    homepageRegister(browser);
    testProject(browser);
    openInspectorPanel(browser, 'Information');
    browser
      .pause(3000)
      .click('.node[data-nodetype="block"]')
      .waitForElementPresent('.single-color-picker', 1000, 'expected a color picker')
      .click('.single-color-picker')
      .waitForElementPresent('.single-color-picker .dropdown')
      .assert.countelements('.single-color-picker .color', 17)
      .end();
  },
}
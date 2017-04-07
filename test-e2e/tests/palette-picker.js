var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInspectorPanel = require('../fixtures/open-inspector-panel');
var testProject = require('../fixtures/testproject');

module.exports = {
  'Open the palette picker for a project': function (browser) {
    size(browser);
    homepageRegister(browser);
    testProject(browser);
    openInspectorPanel(browser, 'Information');
    browser
      .pause(3000)
      // test palette picker on project
      .click('.ProjectHeader .title .text')
      .waitForElementPresent('.expando[data-expando*="Color Palette"]', 1000, 'expected color palette picker expando')
      .click('.expando[data-expando*="Color Palette"]')
      .waitForElementPresent('.palette-picker-content .color', 5000, 'expected a color chip')
      .assert.countelements('.palette-picker-content .color', 16);

    // test palette picker on construct
    browser
      .click('.construct-viewer .title')
      .waitForElementPresent('.expando[data-expando*="Color Palette"]', 1000, 'expected color palette picker expando')
      .click('.expando[data-expando*="Color Palette"]')
      .waitForElementPresent('.palette-picker-content .color', 1000, 'expected a color chip')
      .assert.countelements('.palette-picker-content .color', 16)
      .end();
  }
};
var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var testProject = require('../fixtures/testproject');

module.exports = {
  'Open the palette picker for a project': function (browser) {
    size(browser);
    homepageRegister(browser);
    testProject(browser);
    openInventoryPanel(browser, 'Projects');
    browser
      .pause(3000)
      // test palette picker on project
      .click('.ProjectHeader')
      .waitForElementPresent('.expando[data-expando*="Color Palette"]', 1000, 'expected color palette picker expando')
      .click('.expando[data-expando*="Color Palette"]')
      .waitForElementPresent('.palette-picker-content > .color-picker > .color', 1000, 'expected a color chip')
      .assert.countelements('.palette-picker-content > .color-picker > .color', 16)
    // test palette picker on construct
    browser
      .click('.node[data-nodetype="construct-title"]')
      .waitForElementPresent('.expando[data-expando*="Color Palette"]', 1000, 'expected color palette picker expando')
      // should already be open since it state is synched to the project palette picker
      .waitForElementPresent('.palette-picker-content > .color-picker > .color', 1000, 'expected a color chip')
      .assert.countelements('.palette-picker-content > .color-picker > .color', 16)
      .end();
  }
};
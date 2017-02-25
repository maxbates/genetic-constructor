var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var rightClickAt = require('../fixtures/rightClickAt');
var clickMenuNthItem = require('../fixtures/click-popmenu-nth-item');

module.exports = {
  'Test that we can delete a project' : function (browser) {

    size(browser);
    homepageRegister(browser);
    openInventoryPanel(browser, 'Projects')
    browser
      .waitForElementPresent('.inventory-project-tree .expando', 5000, 'expected project tree with one project')
      .assert.countelements('.inventory-project-tree .expando', 1)
      .assert.countelements('[data-testid^="project"]', 1)
      .pause(1000)
      .click('[data-testid="NewProjectButton"')
      .pause(3000)
      .assert.countelements('[data-testid^="project"]', 2);

    rightClickAt(browser, '.inventory-project-tree .expando', 40, 10);
    clickMenuNthItem(browser, 8);

    browser
      // wait for confirmation dialog and accept
      .waitForElementPresent('.DeleteProjectModal', 5000, 'expected confirmation dialog')
      .pause(3000)
      .click('.Modal button[type="submit"]')
      .waitForElementNotPresent('.DeleteProjectModal', 5000, 'expected confirmation dialog to go away')
      .pause(3000)
      .assert.countelements('[data-testid^="project"]', 1)
      .end();

  }
};

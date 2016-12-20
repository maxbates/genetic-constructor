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
      .assert.countelements('.inventory-project-tree .expando', 1);

    rightClickAt(browser, '.inventory-project-tree .expando', 4, 4 );
    clickMenuNthItem(browser, 5);

    browser
      // wait for confirmation dialog and accept
      .waitForElementPresent('.ok-cancel-form button[type="submit"]', 5000, 'expected confirmation dialog')
      .pause(1000)
      .click('.ok-cancel-form button[type="submit"]')
      .waitForElementNotPresent('.inventory-project-tree .expando', 5000, 'expected no projects')
      .end();

  }
};

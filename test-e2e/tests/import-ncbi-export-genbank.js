var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var http = require("http");
var path = require('path');
var size = require('../fixtures/size');
var searchFor = require('../fixtures/search-for');
var openInventoryPanel = require('../fixtures/open-inventory-panel');

module.exports = {
  'Import an ncbi part when creating a construct and export the genbank file' : function (browser) {

    size(browser);

    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    // start with a new project to ensure no construct viewers are visible
    newProject(browser);

    // term matches insulin in the registry
    searchFor(browser, 'Ncbi', 'Runx1');

    // drag first result to the Promoter block
    browser
      .waitForElementPresent('.InventoryItem[data-inventory^="searchresult NCBI"]', 30000, 'expected search results');

    dragFromTo(browser, '.InventoryItem[data-inventory^="searchresult NCBI"]', 10, 10, '.cvc-drop-target', 20, 20);

    browser
    // wait for a block to appear
      .useXpath()
      .waitForElementVisible('//*[contains(text(), "Runx1")]', 5000, 'expected block runx1 to appear')
      .pause(1000)
      .assert.countelements('//div[@data-nodetype="block"]', 2)
      .end();
  }
};

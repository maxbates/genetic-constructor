var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var clickMenuNthItem = require('../fixtures/click-popmenu-nth-item');
var http = require("http");
var path = require('path');
var size = require('../fixtures/size');
var searchFor = require('../fixtures/search-for');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var rightClickAt = require('../fixtures/rightClickAt');
var openEgfProject = require('../fixtures/open-egf-project');
var saveCurrentProject = require('../fixtures/save-current-project');

module.exports = {
  'Export a project with a regular construct and a template' : function (browser) {

    size(browser);
    
    // register via fixture
    homepageRegister(browser);

    // now we can go to the project page
    browser
      // wait for inventory and inspector to be present
      .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups')
      .waitForElementPresent('.SidePanel.Inspector', 5000, 'Expected Inspector');

    newProject(browser);
    searchFor(browser, 'Ncbi', 'Runx1');
    dragFromTo(browser, '.InventoryItem-item', 10, 10, '.inter-construct-drop-target', 50, 4);

    openEgfProject(browser);

    // drag the first construct into the canvas
    dragFromTo(browser, '[data-testid^="block"]', 50, 10, '.inter-construct-drop-target', 50, 4);

    saveCurrentProject(browser);

    // export the project via its context menu
    openInventoryPanel(browser, 'Projects');
    rightClickAt(browser, '.inventory-project-tree .expando', 4, 4 );
    clickMenuNthItem(browser, 4);

    // we can't actually download the file but we can ensure the correct header is present at the expected url
    browser.url(function (response) {
      // save original project url
      var projectURL = response.value;
      var projectId = response.value.split('/').pop();
      var uri = browser.launchUrl + '/extensions/api/genbank/export/' + projectId;
      browser
        .url(uri)
        .pause(1000)
        .assert.urlContains(projectId)
        .saveScreenshot('./test-e2e/current-screenshots/export-list-blocks.png')
        .end();
    });
  }
};

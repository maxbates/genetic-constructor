var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var newConstruct = require('../fixtures/newconstruct');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');


module.exports = {
  'Test drag and drop on test project.' : function (browser) {

    size(browser);
    homepageRegister(browser);

    // create three constructs total
    newConstruct(browser);
    newConstruct(browser);
    openInventoryPanel(browser, 'Sketch');

    browser
      .waitForElementPresent('.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 5000, 'expected sketch blocks');

    // drag a block to each construct to start them off
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.construct-viewer[data-index="0"] .sceneGraph', 30, 30);
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(2) .RoleSvg', 10, 10, '.construct-viewer[data-index="1"] .sceneGraph', 30, 30);
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(3) .RoleSvg', 10, 10, '.construct-viewer[data-index="2"] .sceneGraph', 30, 30);

    // drag an item from the inventory
    for (var j = 0; j <= 2; j += 1) {
      for (var i = 1; i <= 5; i += 1) {
        dragFromTo(
            browser,
            `.InventoryGroupRole .sbol-tile:nth-of-type(${i}) .RoleSvg`, 10, 10,
            `.construct-viewer[data-index="${j}"] .sceneGraph [data-nodetype="block"]`, 30, 10);
      }
    }

    browser
      .pause(2000)
      .assert.countelements('[data-nodetype="block"]', 18)
      .saveScreenshot('./test-e2e/current-screenshots/draganddrop.png')
      .end();
  }
};

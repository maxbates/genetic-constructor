var dragFromTo = require('./dragfromto');
var openInventoryPanel = require('./open-inventory-panel');

var newproject = function(browser) {
  browser
    .pause(1000)
    // make sure inventory is present
    .waitForElementPresent('.SidePanel.Inventory', 5000, 'Expected Inventory Groups');

  // open projects
  openInventoryPanel(browser, 'Projects');
  browser
    .click('[data-testid="NewProjectButton')
    .pause(1000)
    .waitForElementPresent('.construct-viewer', 5000, 'expect a construct for the new project');

  // ensure inventory open at sketch blocks
  openInventoryPanel(browser, 'Sketch');

  browser
    // wait for symbols to appear
    .waitForElementPresent('.InventoryGroupRole .sbol-tile', 5000, 'expected an inventory item');

  // drag 3 role symbols into construct
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(2) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(3) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(4) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(5) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);
  dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(6) .RoleSvg', 10, 10, '.construct-viewer:nth-of-type(2) .sceneGraph', 600, 60);

  browser
    .pause(250)
    .assert.countelements('[data-nodetype="block"]', 6);

};

module.exports = newproject;

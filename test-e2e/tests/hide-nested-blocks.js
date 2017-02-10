var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');
var openConstructViewerContextMenu = require('../fixtures/open-construct-viewer-context-menu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');


module.exports = {
  'Test drag and drop on different drop targets to create constructs' : function (browser) {

    size(browser);
    homepageRegister(browser);

    // start a new project and delete its only construct
    newProject(browser);
    openConstructViewerContextMenu(browser);
    clickNthContextMenuItem(browser, 2);
    browser
      .waitForElementNotPresent('.construct-viewer', 5000, 'expect construct to be deleted');

    openInventoryPanel(browser, 'Sketch');

    // drag to first target should make a construct
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.inter-construct-drop-target[data-index="0"]', 50, 4);
    browser
      .waitForElementPresent('.construct-viewer[data-index="0"]', 5000, 'expect first construct viewer');

    // add nested block
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 27, 27, '[data-nodetype="block"]', 40, 10);

    browser
      .pause(1000)
      .assert.countelements('[data-nodetype="block"]', 2)
      .click('.construct-viewer .inline-toolbar [data-id="More...');

    clickNthContextMenuItem(browser, 1);
    browser
      .pause(1000)
      .assert.countelements('[data-nodetype="block"]', 1)
      .end();
  }
};

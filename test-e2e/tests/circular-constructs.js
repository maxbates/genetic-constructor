var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var dragFromTo = require('../fixtures/dragfromto');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var newProject = require('../fixtures/newproject');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');

module.exports = {
  'Test construct rules for backbones' : function (browser) {
    size(browser);
    homepageRegister(browser);
    newProject(browser);
    openInventoryPanel(browser, 'Sketch');

    dragFromTo(browser, '.InventoryGroupRole  [data-symbol="backbone"]', 27, 27, '.construct-viewer[data-index="0"] .sceneGraph', 600, 60);

    // produces 2 blocks, start and end cap
    browser
      .assert.countelements('[data-nodetype="block"]', 2);

    // repeat the drag but it should be rejects
    dragFromTo(browser, '.InventoryGroupRole  [data-symbol="backbone"]', 27, 27, '.construct-viewer[data-index="0"] .sceneGraph', 600, 60);

    // still 2 blocks
    browser
      .assert.countelements('[data-nodetype="block"]', 2);

    // regular block should be accepted
    dragFromTo(browser, '.InventoryGroupRole  [data-symbol="ribonuclease"]', 27, 27, '.construct-viewer[data-index="0"] .sceneGraph', 600, 60);

    // now 3 blocks
    browser
      .assert.countelements('[data-nodetype="block"]', 3);

    // delete 3rd block which is the end cap
    openNthBlockContextMenu(browser, '.construct-viewer[data-index="0"] .sceneGraph', 0);
    clickNthContextMenuItem(browser, 2);

    // now 1 block
    browser
      .assert.countelements('[data-nodetype="block"]', 1)
      .end();
  }
};

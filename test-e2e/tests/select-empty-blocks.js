var homepageRegister = require('../fixtures/homepage-register');
var openNthBlockContextMenu = require('../fixtures/open-nth-block-contextmenu');
var clickNthContextMenuItem = require('../fixtures/click-popmenu-nth-item');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');

module.exports = {
  'Test that we can select empty blocks from the block context menu' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);
    openNthBlockContextMenu(browser, '.construct-viewer:nth-of-type(1) .sceneGraph', 5);
    clickNthContextMenuItem(browser, 4);
    browser
      .pause(1000)
      // ensure we have all 3 blocks elements selected
      .assert.countelements(".scenegraph-userinterface-selection", 6)
      .saveScreenshot('./test-e2e/current-screenshots/select-empty-blocks.png')
      .end();
  }
};

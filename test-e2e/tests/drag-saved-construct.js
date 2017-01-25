var homepageRegister = require('../fixtures/homepage-register');
var dragFromTo = require('../fixtures/dragfromto');
var newProject = require('../fixtures/newproject');
var clickMainMenu = require('../fixtures/click-main-menu');
var openInventoryPanel = require('../fixtures/open-inventory-panel');
var size = require('../fixtures/size');

module.exports = {
  'Create a construct, save to inventory, drag out to create a new construct' : function (browser) {

    size(browser);
    homepageRegister(browser);
    newProject(browser);
    openInventoryPanel(browser, "Sketch");

    browser
    // create a new construct with a single block
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(1) .RoleSvg', 10, 10, '.inter-construct-drop-target', 50, 4);
    // and again
    dragFromTo(browser, '.InventoryGroupRole .sbol-tile:nth-of-type(2) .RoleSvg', 10, 10, '.inter-construct-drop-target', 50, 4);

    browser
      // give project time to save and for the construct views to update
      .pause(10000)
      // expect three construct views, two with one block each
      .assert.countelements('.construct-viewer', 3)
      .assert.countelements('[data-nodetype="block"]', 2);

    // click the my projects inventory tab and expect a project.
    openInventoryPanel(browser, 'Projects');

    browser
      // expect two projects ( default one and the new one we created above )
      .waitForElementPresent('.inventory-project-tree [data-testid^="project"]', 5000, 'expect a list of projects to appear')
      .assert.countelements('.inventory-project-tree [data-testid^="project"]', 2)

      // expand loaded project
      .click('.inventory-project-tree .expando .label-selected')
      .pause(1000)
      // expect 2 projects and 3 blocks to be visible
      .assert.countelements('.inventory-project-tree [data-testid^="project"]', 2)
      .assert.countelements('.inventory-project-tree [data-testid^="block"]', 3);

    // drag the first construct into the canvas

    dragFromTo(browser, '.inventory-project-tree [data-testid^="block"] .label-base', 10, 10, '.inter-construct-drop-target', 50, 4);

    // should have a new construct with a corresponding increase in numbers of blocks/role glyphs
    browser
      .pause(2000)
      // expect four constructs and three blocks
      .assert.countelements('.construct-viewer', 4)
      .assert.countelements('[data-nodetype="block"]', 3)
      // generate test image
      .saveScreenshot('./test-e2e/current-screenshots/drag-saved-construct.png')
      .end();

  }
};

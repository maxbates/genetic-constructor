var homepageRegister = require('../fixtures/homepage-register');
var testProject = require('../fixtures/testproject');
var size = require('../fixtures/size');
var closeInventory = require('../fixtures/close-inventory');
var dragFromToVia = require('../fixtures/dragfromtovia');

module.exports = {
  'Test that we can drag a block from the designer into projects to make a new project' : function (browser) {

    size(browser);
    homepageRegister(browser);
    testProject(browser);
    closeInventory(browser);
    dragFromToVia(browser, '[data-nodetype="block"]', 50, 10, '[data-section="Projects"]', 25, 25, '.InventoryGroupProjects', 50, 100);
    browser
      .end();
  }
};

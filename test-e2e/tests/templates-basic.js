var homepageRegister = require('../fixtures/homepage-register');
var size = require('../fixtures/size');
var openTemplatesProject = require('../fixtures/open-templates-project');

module.exports = {
  'Verify all templates are available' : function (browser) {

    // maximize for graphical tests
    size(browser);
    homepageRegister(browser);
    openTemplatesProject(browser);

    browser
      .assert.countelements('[data-nodetype="block"]', 143)
      .saveScreenshot('./test-e2e/current-screenshots/templates-basic.png')
      .end();
  }
};

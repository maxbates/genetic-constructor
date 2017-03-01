var uuid = require('uuid');
var invariant = require('invariant');

var openInventoryPanel = require('../fixtures/open-inventory-panel');
var publishCurrentProject = require('../fixtures/publish-current-project');

// publish a given project, given a project manifest (e.g. from project-set-metadata)
// assumes the project exists in the app, but does navigate to it (not yet tested)
// takes callback (browser, projectManifest) => {}

module.exports = function (browser, projectManifest, cb) {
  invariant(projectManifest && projectManifest.owner && projectManifest.id, 'must pass a valid project');

  //open the project
  browser.execute(function (projectId) {
    window.constructor.api.projects.projectOpen(projectId);
  }, [projectManifest.id], function (result) {

  })
  //wait for it to open, just in case... could check better.
  .pause(2000);

  publishCurrentProject(browser);
  openInventoryPanel(browser, 'Commons');

  var treeSelector = '.tree [data-testid="' + projectManifest.owner + '"]';
  var projectSelector = '.tree [data-testid="' + projectManifest.owner + '/' + projectManifest.id + '"]';

  browser
  .waitForElementPresent('.InventoryGroupCommons', 5000, 'commons should appear')
  .waitForElementPresent(treeSelector, 5000, 'users list of commons projects should appear')
  .click(treeSelector)
  .waitForElementPresent(projectSelector, 5000, 'published project should appear');

  if (cb) {
    browser.execute(() => {}, [], () => cb(browser, projectManifest));
  }
};


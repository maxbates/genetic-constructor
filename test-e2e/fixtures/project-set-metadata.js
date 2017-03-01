var uuid = require('uuid');
var openInspectorPanel = require('../fixtures/open-inspector-panel');

/**
 * set metadata for the project
 * can pass callback (browser, project) => {}
 */
module.exports = function (browser, infoInput, cb) {
  var project = {};

  var info = Object.assign({
    name: uuid.v4(),
    description: 'My great project.',
    keywords: ['yay'],
  }, infoInput);

  browser
  .execute(function (name, description, keywords) {
    var projectId = window.constructor.api.projects.projectGetCurrentId();

    window.constructor.api.projects.projectRename(projectId, name);
    window.constructor.api.projects.projectSetDescription(projectId, description);
    var updatedProject = window.constructor.api.projects.projectSetKeywords(projectId, keywords);

    window.constructor.api.ui.inspectorToggleVisibility(true);
    window.constructor.api.ui.inspectorSelectTab('Information');
    window.constructor.api.focus.focusPrioritize('project');

    return updatedProject;
  }, [info.name, info.description, info.keywords], function (result) {
    Object.assign(project, result.value);
  })

  browser
  .waitForElementPresent('.InspectorContentProject textarea.InputSimple-input', 5000, 'inspector should have opened')
  .assert.value('.InspectorContentProject textarea.InputSimple-input', info.description);

  if (cb) {
    browser.execute(() => {}, [], () => cb(browser, project));
  }
}

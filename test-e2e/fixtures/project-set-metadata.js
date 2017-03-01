var openInspectorPanel = require('../fixtures/open-inspector-panel');

/**
 * set metadata for the project
 */
module.exports = function (browser, name, description, keywords) {
  var projectName = name || 'My Project';
  var projectDescription = description || 'My great description';
  var projectKeywords = keywords || ['yay'];

  // generate mouse move events on body from source to destination
  browser
  .execute(function (name, description, keywords) {
    var projectId = window.constructor.api.projects.projectGetCurrentId();

    window.constructor.api.projects.projectRename(projectId, name);
    window.constructor.api.projects.projectSetDescription(projectId, description);
    var project = window.constructor.api.projects.projectSetKeywords(projectId, keywords);

    window.constructor.api.ui.inspectorToggleVisibility(true);
    window.constructor.api.ui.inspectorSelectTab('Information');
    window.constructor.api.focus.focusPrioritize('project');

    return project;
  }, [projectName, projectDescription, projectKeywords], function (result) {
    var project = result.value;
    //console.log(project);
    return project;
  })
  .waitForElementPresent('.InspectorContentProject textarea.InputSimple-input', 5000, 'inspector should have opened')
  .assert.value('.InspectorContentProject textarea.InputSimple-input', projectDescription);

}

module.exports = function (browser) {
  //open the project
  browser.execute(function () {
    window.constructor.api.projects.projectSave(constructor.api.projects.projectGetCurrentId(), true);
  }, [], function (result) {})
  //wait for it to go through...
  .pause(1000);
};


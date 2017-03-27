var invariant = require('invariant');

//accepts a callback: (browser, rollup) => {}
module.exports = function (browser, cb) {

  invariant(typeof cb === 'function', 'must pass function');

  var rollup = {};

  //open the project
  browser.execute(function () {
    var projectId = window.constructor.api.projects.projectGetCurrentId();
    return window.constructor.api.projects.projectCreateRollup(projectId);
  }, [], function (result) {
    Object.assign(rollup, result.value);
  });

  browser.execute(() => {}, [], () => cb(browser, rollup));
};

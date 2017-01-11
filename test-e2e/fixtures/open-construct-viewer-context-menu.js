/**
 * open the context menu for the construct via its title
 */
module.exports = function (browser) {

  var b;
  // generate mouse move events on body from source to destination
  browser.execute(function() {

    var title = document.body.querySelector('[data-nodetype="construct-title"]');
    var bounds = title.getBoundingClientRect();
    return {left: bounds.left , top: bounds.top, width: bounds.width, height: bounds.height};

  }, [], function(result) {
    b = result.value;
    browser
    .moveToElement('body', b.left + 4, b.top + 4)
    .mouseButtonClick('right')
    .waitForElementPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected an open menu')
  });
};

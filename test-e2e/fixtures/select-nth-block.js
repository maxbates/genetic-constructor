/**
 * select the nth block. Unselects all blocks, then clicks the required block.
 * ( clicking a selected block might start inline editing )
 */
module.exports = function (browser, constructSelector, blockIndex) {

  let b;
  // generate mouse move events on body from source to destination
  browser.execute(function(constructSelector) {

    // click at bottom right of construct viewer to focus and blur any currently selected blocks
    const constructViewer = document.querySelector(constructSelector);
    const b = constructViewer.getBoundingClientRect();
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  }, [constructSelector], (result) => {
    b = result.value;
    browser
      .moveToElement('body', b.right - 10, b.bottom - 10)
      .mouseButtonDown(0)
      .pause(50)
      .mouseButtonUp(0);
  });

  // now click the nth block
  browser.execute(function(constructSelector, blockIndex) {
    // click at bottom right of construct viewer to focus and blur any currently selected blocks
    const constructViewer = document.querySelector(constructSelector);
    const blocks = constructViewer.querySelectorAll('[data-nodetype="block"]');
    const b = blocks[blockIndex].getBoundingClientRect();
    const obj = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    return obj;
  }, [constructSelector, blockIndex], (result) => {
    b = result.value;
    browser
      .moveToElement('body', b.left + 25, b.top + 10)
      .mouseButtonDown(0)
      .pause(50)
      .mouseButtonUp(0)
      .pause(1000);
  });
};


/**
 * get the nth block, within the given selector, bounds in document space
 */
module.exports = function (browser, srcSelector, blockIndex) {
  let b;

  // generate mouse move events on body from source to destination
  browser.execute(function(srcSelector, blockIndex) {
    const src = document.querySelector(srcSelector);
    const blocks = src.querySelectorAll('[data-nodetype="block"]');
    const block = blocks[blockIndex];
    return block.getBoundingClientRect();
  }, [srcSelector, blockIndex], function(result) {
    b = result.value;
    browser
      .moveToElement('body', b.left + 30, b.top + 20)
      .mouseButtonClick('left');
  });
};

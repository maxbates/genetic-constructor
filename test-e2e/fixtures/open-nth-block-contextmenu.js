const selectNthBlock = require('./select-nth-block');
/**
 * get the nth block, within the given selector, bounds in document space
 */
module.exports = function (browser, constructSelector, blockIndex) {
  selectNthBlock(browser, constructSelector, blockIndex);

  // generate mouse move events on body from source to destination
  browser.execute((constructSelector, blockIndex) => {
    const src = document.querySelector(constructSelector);
    const blocks = src.querySelectorAll('[data-nodetype="block"]');
    const block = blocks[blockIndex];
    const b = block.getBoundingClientRect();
    return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
  }, [constructSelector, blockIndex], (result) => {
    const b = result.value;

    browser
      .moveToElement('body', b.right - 10, b.bottom - 10)
      .mouseButtonClick('right')
      .waitForElementPresent('.menu-overlay .menu-overlay-menu', 5000, 'expected an open menu');
  });
};

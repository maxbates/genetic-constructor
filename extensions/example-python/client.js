/*
//simple demonstration of a background script, run when loaded
window.constructor.extensions.api('example-python', '', {
  method: 'POST',
  body: 'this is some file content that I want to send!',
})
  .then(function logResponse(response) {
    console.log('got the response');
    console.log(response);
  });
*/

function getComplement(seq) {
  return window.constructor.extensions.api('example-python', '', {
    method: 'POST',
    body: seq,
  })
    .then(function getText(resp) { return resp.text(); });
}

function render(container, optinons) {
  container.innerHTML = 'example-python extension - loading';

  //register a subscription to the store
  var subscription = window.constructor.store.subscribe(function (state, lastAction) {
    var focusedBlocks = state.focus.blockIds;

    if (focusedBlocks.length > 0) {
      Promise.all(
        state.focus.blockIds.map(function (blockId) {
          return window.constructor.api.blocks.blockGetSequence(blockId)
            .then(getComplement);
        })
      )
        .then(function (sequences) {
          console.log(sequences);
          return sequences.join('').trim();
        })
        .then(function (sequence) { container.innerHTML = sequence; });
    }
  });

  //return it to unregister when we break down component
  return subscription;
}

window.constructor.extensions.register('example-python', 'projectDetail', render);

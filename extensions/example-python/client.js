//this is just a simple demonstration of a background script

window.constructor.extensions.api('example-python', '', {
  method: 'POST',
  body: 'this is some file content that I want to send!',
})
  .then(function logResponse(response) {
    console.log('got the response');
    console.log(response);
  });
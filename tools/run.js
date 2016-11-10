function format(time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

//color something magenta
function magentaLog(msg) {
  console.log(`\x1b[35m${msg}\x1b[0m`);
}

function run(fn, options) {
  const task = typeof fn.default === 'undefined' ? fn : fn.default;
  const start = new Date();

  magentaLog(`[${format(start)}] Starting '${task.name}${options ? `(${options})` : ''}'...`);

  return task(options).then(() => {
    const end = new Date();
    const time = end.getTime() - start.getTime();

    magentaLog(`[${format(end)}] Finished '${task.name}${options ? `(${options})` : ''}' after ${time} ms`);
  })
    .catch(err => {
      console.log(err);
      throw err;
    });
}

//e.g. babel-node tools/run script
if (process.mainModule.children.length === 0 && process.argv.length > 2) {
  delete require.cache[__filename];
  const askdjfhakjsdf = require(`./${process.argv[2]}.js`);

  //for some reason module.default is not always defined... hence ugly name
  run(askdjfhakjsdf).catch(err => console.error(err.stack));
}

export default run;

import run from './run';
import setup from './setup';
import bundle from './bundle';
import bundleServer from './bundleServer';

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (build) folder.
 */
async function build() {
  const processes = await run(setup);
  await run(bundleServer);
  await run(bundle);

  console.log('bundle complete, killing processes...');

  processes.forEach((proc) => {
    if (proc) {
      proc.kill('SIGTERM');
    }
  });

  process.exit(0);
}

export default build;

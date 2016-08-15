import { exec, spawn } from 'child_process';
import path from 'path';

//todo - have a check to make sure docker is running

/** paths **/

const pathProjectRoot = path.resolve(__dirname, '../');
let pathBioNanoPlatform = path.resolve(pathProjectRoot, '../bio-user-platform');

/** config **/

//if this isnt working, you can debug with --DEBUG flag
const DEBUG = process.argv.includes('--DEBUG');
if (!DEBUG) {
  console.log('debug auth startup by passing --DEBUG');
}

//allow overwriting the bio-user-platform path
process.argv.forEach((val, index) => {
  const argFlag = 'PLATFORM_PATH';
  if (val.startsWith(argFlag)) {
    const newPath = val.substr(argFlag.length + 1);
    pathBioNanoPlatform = newPath;
  }
});
console.log('path for bio-user-platform is ' + pathBioNanoPlatform + '. Set by passing --PLATFORM_PATH=/your/path');

/** command utils **/

//simple wrap around console.log
const log = (output = '', forceOutput = false) => {
  if (DEBUG || forceOutput === true) {
    console.log(output.trim());
  }
};

const promisedExec = (cmd, opts, {
  forceOutput = false,
} = {}) => {
  console.log('running ' + cmd);

  return new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return reject(err);
      }

      //`` to convert from buffers
      if (stdout) {
        log(`${stdout}`, forceOutput);
      }
      if (stderr) {
        log(`${stderr}`, forceOutput);
      }

      return resolve(`${stdout}`, `${stderr}`);
    });
  });
};

const spawnWaitUntilString = (cmd, args, opts, {
  waitUntil = `${Math.random()}`,
  forceOutput = false,
  failOnStderr = false,
} = {}) => {
  console.log('\nrunning: ' + cmd + ' ' + args.join(' '));

  return new Promise((resolve, reject) => {
    //const [ command, ...args ] = cmd.split(' ');
    const process = spawn(cmd, args, opts);

    process.stdout.on('data', data => {
      log(`${data}`, forceOutput);
      if (`${data}`.indexOf(waitUntil) >= 0) {
        resolve(process);
      }
    });

    process.stderr.on('data', data => {
      log(`${data}`, true);
      if (`${data}`.indexOf(waitUntil) >= 0) {
        return resolve(process);
      }
      if (failOnStderr === true) {
        console.log('REJECTING');
        process.kill();
        reject(process);
      }
    });

    process.on('error', (err) => {
      console.log('Error in process');
      console.log(err);
    });

    process.on('close', (code) => {
      log(`child process exited with code ${code}`, forceOutput);
    });
  });
};

/** scripts **/

let dockerEnv;

const setupBioNanoPlatform = (useGenomeDesignerBranch = false) => {
  const checkoutPromise = useGenomeDesignerBranch == true ?
    promisedExec(`git checkout genome-designer`,
      { cwd: pathBioNanoPlatform }
    ) :
    Promise.resolve();

  return checkoutPromise
    .then(() => promisedExec(`npm install`,
      { cwd: pathBioNanoPlatform }
    ));
};

const startBioNanoPlatform = () => {
  return spawnWaitUntilString('npm', ['run', 'storage-background'],
    {
      cwd: pathBioNanoPlatform,
      env: Object.assign({}, process.env, dockerEnv),
    },
    { waitUntil: 'database system is ready to accept connections' }
  );
};

const startAuthServer = () => {
  return spawnWaitUntilString('npm', ['start'],
    { cwd: pathBioNanoPlatform },
    { waitUntil: `{ address: { address: '::', family: 'IPv6', port: 8080 } } 'started'` });
};

const startRunAuth = () => {
  console.log('\n\n');
  return spawnWaitUntilString('npm', ['run', 'auth'],
    { cwd: pathProjectRoot },
    {
      waitUntil: 'Server listening at http://0.0.0.0:3000/',
      forceOutput: true,
      failOnStderr: false,
    }
  );
};

async function auth() {
  try {
    await setupBioNanoPlatform();
    await startBioNanoPlatform();
    await startAuthServer();
    await startRunAuth();
  } catch (err) {
    console.log('CAUGHT', err);
    throw err;
  }
}

export default auth;

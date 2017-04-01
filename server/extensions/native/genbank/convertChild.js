/*
 Copyright 2016 Autodesk,Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const cp = require('child_process');

process.on('message', (message) => {
  //whether we are importing or exporting
  const conversion = message.type === 'import' ? 'from_genbank' : 'to_genbank';

  const command = `python convert.py ${conversion} ${message.input} ${message.output}`;

  cp.exec(command, (err, stdout) => {
    if (err) {
      console.log(`Python childProcess error: ${command}`);
      console.log(err);
      console.log(err.stack);
      return process.send({ id: message.id, success: false, error: err, result: stdout });
    }

    process.send({ id: message.id, success: true, result: stdout });
  });

  /*
   // DEBUG USING SPAWN
   // todo - solidify this, so can use all the time without overflowing buffer?
   //note - you may need to explicitly stop listening to stdio so the process dies on server restart
   const [cmd, ...args] = command.split(' ');

   const spawned = cp.spawn(cmd, args, { silent: false });

   let result = '';

   //stdio only defined when piped, not if inherited / ignored
   if (spawned.stdout) {
   spawned.stdout.on('data', (data) => {
   console.log(`${data}`);
   result += `${data}`;
   });

   spawned.stderr.on('data', (data) => {
   console.log('stderr');
   console.log(`${data}`);
   result += `${data}`;
   });
   }

   spawned.on('error', (err) => {
   console.error('Error in process');
   console.error(err);
   return process.send({ id: message.id, success: false, error: err, result });
   });

   spawned.on('close', (code) => {
   console.log(`child process exited with code ${code}`);
   if (code === null || code > 0) {
   return process.send({ id: message.id, success: false, error: code, result });
   }
   process.send({ id: message.id, success: true, result });
   });
   */
});

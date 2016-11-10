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

import testSetup from './test-setup';

//todo - meant to replace the makefile

//const withCoverage = process.env.COVERAGE === 'true';

//const mochaCommand = `./node_modules/mocha/bin/mocha --recursive --compilers js:babel-register,css:test/css-null-compiler.js --require ./test/setup.js --timeout 25000 -u bdd --reporter spec`;

async function test() {
  await testSetup();

  console.log('THIS TOOL NOT YET COMPLETE');

  //todo - need to close process once done, not keep listening at server
  //todo need to exit properly for test suite
  //todo need to allow coverage tool to hook into this
}

export default test;

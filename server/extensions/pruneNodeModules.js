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

//run this script with node to clear our extensions which are not listed in server/extensions/package.json
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const nodeModulePath = path.resolve(__dirname, 'node_modules');

fs.stat(nodeModulePath, function checkDirExists(err, stat) {
  if (err) {
    if (err.code === 'ENOENT') {
      return;
    }

    console.error('error checking for directory server/extensions/node_modules');
    console.error(err);
    throw err;
  }

  const pkg = require(path.resolve(__dirname, 'package.json'));
  const deps = pkg.dependencies;
  const dirContents = fs.readdirSync(nodeModulePath);

  dirContents.forEach(function checkDir(dir) {
    if (!deps[dir]) {
      rimraf(path.resolve(nodeModulePath, dir), function callback() {
        console.log('deleted extension (not listed in package.json): ' + dir);
      });
    }
  });
});


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

var fs = require('fs');
var path = require('path');
var invariant = require('invariant');
var _ = require('lodash');

//todo - this can't be es2016 format - either rewrite, or try updating to node 6.x (may be other breaking changes)...
var manifestUtils = require('../../server/extensions/manifestUtils.js');

// todo - ensure this is module not webpacked

var registry = {};

//future - this should include the 'native' extensions -- these wont show up in registry currently

var nodeModulesDir = path.resolve(__dirname, './node_modules');

fs.readdirSync(nodeModulesDir).forEach(function goThroughExtensions(packageName) {
  try {
    //skip the test extensions unless we're in the test environment
    if (packageName.substring(0, 4).toLowerCase() === 'test' && process.env.NODE_ENV !== 'test') {
      return;
    }

    //future process.env.BUILD support (if not already handled by line above)
    var filePath = path.resolve(nodeModulesDir, packageName + '/package.json');
    var depManifest = require(filePath);

    manifestUtils.validateManifest(depManifest);

    Object.assign(registry, {
      [packageName]: depManifest,
    });
  } catch (err) {
    console.warn('\n\nerror loading extension: ' + packageName);
    console.error(err);
  }
});

console.log('[Extensions Loaded] ' + Object.keys(registry));

function list() {
  //future - prefer optimized version
  //const filters = Array.apply(null, arguments);
  var filters = Array.prototype.slice.call(arguments);

  return _.reduce(filters, function pickFilter(acc, filter) {
    return _.pickBy(acc, filter);
  }, registry);
}

function get(name) {
  return registry[name] || null;
}

function isRegistered(name) {
  return registry.hasOwnProperty(name);
}

function getClientExtensions() {
  return list(manifestUtils.manifestIsClient);
}

function getServerExtensions() {
  return list(manifestUtils.manifestIsServer);
}

function getInternalFilePath(name, filePath) {
  invariant(isRegistered(name), 'extension must be registered');
  invariant(filePath && typeof filePath === 'string', 'must pass a path');
  return path.resolve(nodeModulesDir, name, filePath);
}

//HACK
//enable dynamic requires, outside of webpack bundle
//do not allow API access to this.
function requireInternalFile(name, filePath) {
  var fullPath = getInternalFilePath(name, filePath);
  return require(fullPath);
}

module.exports = {
  list: list,
  get: get,
  getClientExtensions: getClientExtensions,
  getServerExtensions: getServerExtensions,
  isRegistered: isRegistered,
  getInternalFilePath: getInternalFilePath,
  requireInternalFile: requireInternalFile,
};

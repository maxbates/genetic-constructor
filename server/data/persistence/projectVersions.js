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

//todo - consistent messaging + message types, user tags, timestamps
//todo - update middleware on client, expecting commmit SHA, to expect version

const dummyVersionPayload = () => ({
  version: -1,
});

export const projectVersionGet = () => {
  //todo - get a version from the database
};

//is this necessary? Versioning should just happen.
//export const projectVersionSave = () => {
//  //todo - ensure it returns a commit-like response w/ version (check previous usages of git.commit())
//  return dummyVersionPayload();
//};

//this creates a *major* version and should include some metadata
export const projectVersionSnapshot = () => {
  //todo - ensure it returns a commit-like response w/ version (check previous usages of git.snapshot())

  return dummyVersionPayload();
};

export const projectVersionList = () => {
  //todo  - should work similarly to git.log()
};

export const projectVersionExists = () => {
  //todo - check if a version exists
};

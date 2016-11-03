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
import chai from 'chai';
import * as api from '../../src/middleware/snapshots';
const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Snapshots', () => {

    it('snapshotList() before projects exists gets 404');

    it('snapshotList() on project with no snapshots gets 200');

    it('snapshotWrite() makes a snapshot');

    it('snapshotWrite() overwrites a snapshot');

    it('snapshotGet() gets a snapshot');

    it('snapshotList() gets the projects snapshots');

  });
});

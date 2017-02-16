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

//shared on server and client

export const SNAPSHOT_TYPE_PUBLISH = 'SNAPSHOT_PUBLISH';
export const COMMONS_TAG = 'COMMONS_TAG';

export const snapshotIsPublished = snapshot => snapshot.tags[COMMONS_TAG];

export const commonsDefaultMessage = 'Published Project';

//todo - should use constants from snapshots. requires shared constants file without any imports (so can be used on client
export const nameSnapshot = (snapshot) => {
  switch (snapshot.type) {
    case SNAPSHOT_TYPE_PUBLISH:
      return 'Published to Commons';
    case 'SNAPSHOT_ORDER': {
      const foundry = snapshot.tags.foundry;
      return `Order${foundry ? ` at ${foundry}` : ''}`;
    }
    case 'SNAPSHOT_USER':
    default:
      return 'Saved Snapshot';
  }
};

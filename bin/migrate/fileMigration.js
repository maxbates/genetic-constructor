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

import path from 'path';
import fetch from 'isomorphic-fetch';
import fs from 'fs';
import _ from 'lodash';
import batchPromises from './batchPromises';
import { defaultUser } from '../../server/auth/local';

import * as fileSystem from '../../server/data/middleware/fileSystem';
import * as s3 from '../../server/data/middleware/s3';

if (!s3.useRemote) {
  throw new Error('must use S3 - pass s3 credentials to propcess');
}

// move project files
// update the projects so they know about their files - will need to include versioning information on the write
// namespacing - need to know projectId
// appropriate permissions



//todo - check importers and see how they expect these to exist? may just need to copy by file name (maybe handle projectId)
// move imported files (now, job files)
// namespace by projectId - will need to check projects' block.source.id ???
// appropriate namespacing (Genbank, CSV) -> import



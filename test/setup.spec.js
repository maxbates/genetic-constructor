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

//setup.js is required directly - does not have a global test suite
//this file is part of the tests, and adds starting server + deleting test user data to start
//requires that SERVER_MANUAL=true env var is set

import { listenSafely } from '../server/server';
import * as s3 from '../server/data/middleware/s3';
import { testUserId } from './constants';
import { deleteUser } from '../server/data/persistence/admin';

//wait for server to be ready and start with a clean slate
before(() => {
  console.log('starting server...'); //eslint-disable-line
  return listenSafely()
    .then(() => {
      console.log('deleting all testUser data from DB...'); //eslint-disable-line
      return deleteUser(testUserId);
    })
    .then(() => {
      if (s3.useRemote) {
        return Promise.all(s3.buckets.map(bucketName => {
          console.log('clearing S3 bucket ' + bucketName); //eslint-disable-line
          const bucket = s3.getBucket(bucketName);
          return s3.emptyBucketTests(bucket);
        }));
      }
    });
});
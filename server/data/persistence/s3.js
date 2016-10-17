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
import invariant from 'invariant';

//todo - better error handling

//todo - set up a logger so console not clobbered

let AWS;

if (process.env.NODE_ENV === 'production' || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
  invariant(!!process.env.AWS_ACCESS_KEY_ID, 'expected env var AWS_ACCESS_KEY_ID');
  invariant(!!process.env.AWS_SECRET_ACCESS_KEY, 'expected env var AWS_SECRET_ACCESS_KEY');

  AWS = require('aws-sdk');

  AWS.config.update({
    region: 'us-west-2',
  });
}

export const getBucket = (Bucket) => new AWS.S3({ params: { Bucket } });

//expects a bucket with bucket name already defined
export const objectExists = (bucket, Key) => {
  return new Promise((resolve, reject) => {
    bucket.headObject({ Key }, (err, result) => {
      if (err) {
        console.log(err, err.stack);
        return reject(false);
      }
      return resolve(true);
    });
  });
};

export const objectGet = (bucket, Key, params = {}) => {
  return new Promise((resolve, reject) => {
    const req = Object.assign(
      {
        ResponseContentType: 'text/plain',
      },
      params,
      { Key }
    );

    bucket.getObject(req, (err, result) => {
      if (err) {
        console.log(err, err.stack);
        return reject(err);
      }
      return resolve(result.Body);
    });
  });
};

//todo - need to support errors when copying file - they can still return a 200 (not sure if aws-sdk handles this)
export const objectPut = (bucket, Key, Body, params = {}) => {
  return new Promise((resolve, reject) => {
    const req = Object.assign(
      {
        ContentType: 'text/plain',
      },
      params,
      { Body, Key },
    );

    bucket.putObject(req, (err, result) => {
      if (err) {
        console.log(err, err.stack);
        return reject(err);
      }
      return resolve(Body);
    });
  });
};

export const objectDelete = (bucket, Key) => {
  return new Promise((resolve, reject) => {
    bucket.deleteObject({ Key }, (err, result) => {
      if (err) {
        console.log(err, err.stack);
        return reject(err);
      }
      return resolve(result.DeleteMarker);
    });
  });
};

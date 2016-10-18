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

export const useRemote = process.env.NODE_ENV === 'production' || (
    (!process.env.FORCE_LOCAL || (!!process.env.FORCE_LOCAL && process.env.FORCE_LOCAL !== 'true')) &&
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  );

//todo - better error handling

let AWS;

if (process.env.NODE_ENV === 'production' || (
    (!process.env.FORCE_LOCAL || (!!process.env.FORCE_LOCAL && process.env.FORCE_LOCAL !== 'true')) &&
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
  )) {
  invariant(!!process.env.AWS_ACCESS_KEY_ID, 'expected env var AWS_ACCESS_KEY_ID');
  invariant(!!process.env.AWS_SECRET_ACCESS_KEY, 'expected env var AWS_SECRET_ACCESS_KEY');

  AWS = require('aws-sdk');

  AWS.config.update({
    region: 'us-west-2',
  });
}

export const getBucket = (Bucket) => new AWS.S3({ params: { Bucket } });

//synchronous
export const getSignedUrl = (bucket, Key, operation = 'getObject', opts = {}) => {
  const params = Object.assign({ Expires: 60 }, opts, { Key });
  return bucket.getSignedUrl(operation, params);
};

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

export const itemGetBuffer = (bucket, Key, params = {}) => {
  return new Promise((resolve, reject) => {
    const req = Object.assign({},
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

export const stringGet = (bucket, Key, params = {}) => {
  const stringParams = Object.assign({}, params, { ResponseContentType: 'text/plain' });

  return itemGetBuffer(bucket, Key, stringParams)
    .then(result => result.toString('utf-8'));
};

export const objectGet = (bucket, Key, params = {}) => {
  const objParams = Object.assign({}, params, { ContentType: 'application/json' });

  return stringGet(bucket, Key, objParams)
    .then(result => JSON.parse(result));
};

//todo - need to support errors when copying file - they can still return a 200 (not sure if aws-sdk handles this)
export const stringPut = (bucket, Key, Body, params = {}) => {
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

export const objectPut = (bucket, Key, obj, params = {}) => {
  invariant(typeof obj === 'object', 'must pass object to objectPut');
  const Body = JSON.stringify(obj);
  const objParams = Object.assign({}, params, { ContentType: 'application/json' });
  return stringPut(bucket, Key, Body, objParams);
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

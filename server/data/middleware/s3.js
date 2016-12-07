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
import colors from 'colors/safe';
import { errorDoesNotExist } from '../../utils/errors';

//API docs: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
/*
 this module wraps some AWS SDK commands in promises, with minimal type handling.

 All the functions expect a bucket where the param Bucket is already bound

 Terms:
 - item =  generic
 - string = string
 - object = object

 e.g. stringGet vs. objectPut
 */

/* config */

//double bang to make sure not empty string
const awsKeyEnvVarsSet = !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY;

const forceLocal = ((process.env.FORCE_LOCAL !== null) && (process.env.FORCE_LOCAL === 'true'));

export const useRemote = ((!forceLocal) && ((process.env.NODE_ENV === 'production') || awsKeyEnvVarsSet));

console.log(colors.yellow('[S3 Config] AWS Keys set via environment variables? ' + awsKeyEnvVarsSet));
console.log(colors.yellow('[S3 Config] Force Local Storage? ' + forceLocal));
console.log(colors.yellow('[S3 Config] Remote Persistence Enabled? ' + useRemote));

//these are all the buckets the app expects
// TODO these should be configurable
export const buckets = [
  'bionano-gctor-files',
  'bionano-gctor-sequences',
  'bionano-gctor-jobs',
];

//namespace keys by environment, version, etc.
export const testPrefix = 'TEST/'; //in test environment, prefix everything so easier to clean up
const storageVersion = '1'; //static, for data migrations
const environment = !!process.env.BNR_ENVIRONMENT ? process.env.BNR_ENVIRONMENT + '/' : ''; //environment so data is siloed across environments
const setupKey = (prefix) => {
  let key = `${environment}${storageVersion}/${prefix}`;

  //last (so its the first prefix), add test prefix for test environments
  if (process.env.NODE_ENV === 'test') {
    key = testPrefix + key;
  }

  return key;
};

//ensure we have consistent fields returned
const massageResult = (obj, Prefix) => {
  const prefix = Prefix ?
    `${Prefix}/` :
    setupKey('/'); //if no specific prefix provided, hide the stuff we do automatically

  //explicitly remap a few fields so we know they are there / fields to expect
  return Object.assign(obj, {
    name: obj.Key.replace(prefix, ''), //get rid of folder slash preceding file name
    Key: obj.Key,
    LastModified: obj.LastModified,
    Size: obj.Size,
  });
};

let AWS;
if (useRemote) {
  invariant(!!process.env.AWS_ACCESS_KEY_ID, 'production environment uses AWS, unless specify env var FORCE_LOCAL=true. expected env var AWS_ACCESS_KEY_ID');
  invariant(!!process.env.AWS_SECRET_ACCESS_KEY, 'production environment uses AWS, unless specify env var FORCE_LOCAL=true. expected env var AWS_SECRET_ACCESS_KEY');

  AWS = require('aws-sdk');

  AWS.config.update({
    region: process.env.AWS_S3_LOCATION || 'us-west-1',
  });
}

/*********** API ************/

//should run before server starts. s3 persistence modules expect buckets to exist
//promise
export const ensureBucketProvisioned = (Bucket) => {
  return new Promise((resolve, reject) => {
    console.log('Setting up S3 Bucket', Bucket); //eslint-disable-line

    const API = new AWS.S3();

    API.headBucket({ Bucket }, (err, data) => {
      if (err) {
        console.log(`Creating new S3 bucket ${Bucket}`);
        const createParams = {
          Bucket,
          ACL: 'private',
          CreateBucketConfiguration: {
            LocationConstraint: 'us-west-1',
          },
        };

        API.createBucket(createParams, (err, data) => {
          if (err) {
            console.log(`Failed to create S3 Bucket ${Bucket}\nError: ${err}`);
            return reject(err);
          }

          console.log(`S3 Bucket created: ${Bucket}`);

          API.waitFor('bucketExists', { Bucket }, (err, data) => {
            if (err) {
              console.log('Error waiting for bucket to exist:', Bucket);
              return reject(err);
            }
            return resolve(data);
          });
        });
      } else {
        //already exists off the bat
        resolve(data);
      }
    });
  });
};

//sync
//expects the bucket exists - setup prior to server start with ensureBucketProvisioned
export const getBucket = (Bucket) => {
  return new AWS.S3({ params: { Bucket } });
};

//synchronous
export const getSignedUrl = (bucket, key, operation = 'getObject', opts = {}) => {
  const Key = setupKey(key);
  const params = Object.assign({ Expires: 60 }, opts, { Key });

  return bucket.getSignedUrl(operation, params);
};

export const itemExists = (bucket, key) => {
  const Key = setupKey(key);

  return new Promise((resolve, reject) => {
    bucket.headObject({ Key }, (err, result) => {
      if (err) {
        if (err.statusCode === 404) {
          return resolve(false);
        }

        //unhandled
        console.log(err, err.stack);
        return reject(err);
      }
      return resolve(true);
    });
  });
};

export const folderContents = (bucket, prefix, params = {}) => {
  const Prefix = setupKey(prefix);

  return new Promise((resolve, reject) => {
    const req = Object.assign({}, params, { Prefix });
    bucket.listObjects(req, (err, results) => {
      if (err) {
        if (err.statusCode) {
          if (err.statusCode === 404) {
            return reject(errorDoesNotExist);
          }
        }
        //unhandled error
        console.log(err, err.stack);
        return reject(err);
      }

      if (results.IsTruncated) {
        console.warn('S3 results truncated - we do not handle pagination');
      }

      if (!results.Contents) {
        return resolve([]);
      }

      //remap data to account for Prefix
      const mapped = results.Contents.map(obj => massageResult(obj, Prefix));

      return resolve(mapped);
    });
  });
};

export const bucketVersioned = (bucket) => {
  return new Promise((resolve, reject) => {
    bucket.getBucketVersioning({}, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result.Status === 'Enabled');
    });
  });
};

export const itemVersions = (bucket, Key, params = {}) => {
  //use key as the prefix so only get its versions
  const Prefix = setupKey(Key);

  return new Promise((resolve, reject) => {
    const req = Object.assign({}, params, {
      Prefix,
    });
    bucket.listObjectVersions(req, (err, results) => {
      if (err) {
        console.log('got error');
        console.log(err);
        return reject(err);
      }

      //expect notable keys Key, VersionId, LastModified
      const mapped = results.Versions.map(obj => massageResult(obj, Prefix));

      resolve(mapped);
    });
  });
};

// GET

export const itemGetBuffer = (bucket, key, params = {}) => {
  const Key = setupKey(key);

  return new Promise((resolve, reject) => {
    const req = Object.assign({},
      params,
      { Key }
    );

    bucket.getObject(req, (err, result) => {
      if (err) {
        if (err.statusCode) {
          if (err.statusCode === 404) {
            return reject(errorDoesNotExist);
          }
        }
        //unhandled error
        console.log(err, err.stack);
        return reject(err);
      }
      //just return the file content (no need yet for file metadata)
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
  const objParams = Object.assign({}, params, { ResponseContentType: 'application/json' });

  return stringGet(bucket, Key, objParams)
    .then(result => {
      try {
        return JSON.parse(result);
      } catch (err) {
        console.log('error parsing JSON in objectGet', Key, result.substring(0, 100));
        return Promise.reject(result);
      }
    });
};

// PUT

//todo - need to support errors when copying file - they can still return a 200 (not sure if aws-sdk handles this) -- check the docs for this
//Body can be a buffer, or just a string, or whatever
export const itemPutBuffer = (bucket, key, Body, params = {}) => {
  const Key = setupKey(key);

  return new Promise((resolve, reject) => {
    const req = Object.assign({},
      params,
      { Body, Key }
    );

    bucket.putObject(req, (err, result) => {
      if (err) {
        //unhandled error
        console.log(err, err.stack);
        return reject(err);
      }
      return resolve(result);
    });
  });
};

export const stringPut = (bucket, Key, string, params = {}) => {
  invariant(typeof string === 'string', 'must pass string');
  const reqParams = Object.assign({ ContentType: 'text/plain' }, params);

  return itemPutBuffer(bucket, Key, string, reqParams);
};

export const objectPut = (bucket, Key, obj, params = {}) => {
  invariant(typeof obj === 'object', 'must pass object to objectPut');

  const Body = JSON.stringify(obj);
  const objParams = Object.assign({}, params, { ContentType: 'application/json' });
  return stringPut(bucket, Key, Body, objParams);
};

// DELETE

const _itemDelete = (bucket, Key, VersionId = null) => {
  return new Promise((resolve, reject) => {
    const req = { Key };
    if (VersionId) {
      Object.assign(req, { VersionId });
    }

    bucket.deleteObject(req, (err, result) => {
      if (err) {
        if (err.statusCode === 404) {
          return reject(errorDoesNotExist);
        }

        //unhandled
        console.log(err, err.stack);
        return reject(err);
      }

      return resolve(result.DeleteMarker);
    });
  });
};

export const itemDelete = (bucket, key, version) => {
  const Key = setupKey(key);

  return _itemDelete(bucket, Key, version);
};

//this is kinda hardwired so you dont make mistakes
//clears everything prefixed with testPrefix in the bucket
export const emptyBucketTests = (bucket) => {
  return new Promise((resolve, reject) => {
    const req = { Prefix: testPrefix };
    bucket.listObjects(req, (err, results) => {
      if (!results.Contents) {
        return resolve();
      }

      return Promise.all(results.Contents.map(item => _itemDelete(bucket, item.Key)))
        .then(() => {
          if (results.IsTruncated === true) {
            return resolve(emptyBucketTests(bucket));
          }

          return resolve();
        });
    });
  });
};


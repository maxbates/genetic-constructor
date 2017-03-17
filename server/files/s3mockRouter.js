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

// mocks s3 routes, so we have simple file URLs (e.g. for jobs)
// see agnosticFs signedUrl
// has no permissions / ACL
// returns different things than S3 does, but read / write should work

import bodyParser from 'body-parser';
import express from 'express';

import * as fileSystem from '../data/middleware/fileSystem';

const router = express.Router(); //eslint-disable-line new-cap
const textParser = bodyParser.text({
  limit: '500mb',
});

//todo - check if s3 differentiates between POST / PUT on signed URLs (i.e. putObject)

router.route(/.*/)
.all((req, res, next) => {
  Object.assign(req, {
    filePath: req.url,
  });
  next();
})
.get((req, res, next) => {
  fileSystem.fileRead(req.filePath, false)
  .then(res.send)
  .catch(err => res.status(500).send(err));
})
.post(textParser, (req, res, next) => {
  if (typeof req.body !== 'string') {
    return res.status(422).send('send a string');
  }

  const folderPath = req.filePath.substring(0, req.filePath.lastIndexOf('/'));

  fileSystem.directoryMake(folderPath)
  .then(() => fileSystem.fileWrite(req.filePath, req.body, false))
  .then(() => res.status(200).send())
  .catch(err => res.status(500).send(err));
})
.put(textParser, (req, res, next) => {
  if (typeof req.body !== 'string') {
    return res.status(422).send('send a string');
  }

  const folderPath = req.filePath.substring(0, req.filePath.lastIndexOf('/'));

  fileSystem.directoryMake(folderPath)
  .then(() => fileSystem.fileWrite(req.filePath, req.body, false))
  .then(() => res.status(200).send())
  .catch(err => res.status(500).send(err));
})
.delete((req, res, next) => {
  fileSystem.fileDelete(req.filePath, false)
  .then(res.send)
  .catch(err => res.status(500).send(err));
});

export default router;

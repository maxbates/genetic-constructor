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
import express from 'express';
import bodyParser from 'body-parser';
import { errorDoesNotExist } from '../utils/errors';
import { clientBundleUrl, defaultClientFilePath } from './constants';
import extensionRegistry, { getClientExtensions } from './registry';
import loadExtension, { getExtensionInternalPath} from './loadExtension';
import errorHandlingMiddleware from '../utils/errorHandlingMiddleware';
import extensionApiRouter from './apiRouter';

//native extensions
import csvRouter from './native/csv/index';
import fastaRouter from './native/fasta/index';
import genbankRouter from './native/genbank/index';

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json();

router.use(jsonParser);
router.use(errorHandlingMiddleware);

router.get('/list', (req, res) => {
  //console.log(extensionRegistry);
  res.json(getClientExtensions());
});

router.get('/manifest/:extension', (req, res, next) => {
  const { extension } = req.params;
  const manifest = getClientExtensions()[extension];

  if (!manifest) {
    return res.status(400).send(errorDoesNotExist);
  }

  return res.json(manifest);
});

if (process.env.NODE_ENV !== 'production') {
  //make the whole extension available
  router.get('/load/:extension/:filePath?', (req, res, next) => {
    const { filePath = clientBundleUrl, extension } = req.params;
    const extensionFile = getExtensionInternalPath(extension, filePath);

    res.sendFile(extensionFile, (err) => {
      if (err) {
        console.log('got an error sending extension!', err);
        console.log(err.stack);
        //don't write headers because express may complain about them already being set
      }
      //force ending of response, since lib/response seems not to if we provide a callback
      return res.end();
    });
  });
} else {
  //only index.js (i.e. clientBundleUrl) files are available

  router.get('/load/:extension/:filePath?', (req, res, next) => {
    const { extension } = req.params;

    loadExtension(extension)
      .then(manifest => {
        const filePath = getExtensionInternalPath(extension);
        res.sendFile(filePath, (err) => {
          if (err) {
            console.log('error sending extension!', err);
            console.log(err.stack);
            //don't write headers because express may complain about them already being set
          }
          //force ending of response, since lib/response seems not to if we provide a callback
          return res.end();
        });
      })
      .catch(err => {
        if (err === errorDoesNotExist) {
          return res.status(404).send(errorDoesNotExist);
        }
        next(err);
      });
  });
}

//handle native extensions which are included statically
router.use('/api/csv', csvRouter);
router.use('/api/fasta', fastaRouter);
router.use('/api/genbank', genbankRouter);

//other /api routes deleted to extension API router
router.use('/api', extensionApiRouter);

export default router;

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
const express = require('express');
const bodyParser = require('body-parser');

const blast = require('./blast');
const parseJson = require('./parseJson');

const router = express.Router(); //eslint-disable-line new-cap
const textParser = bodyParser.text({ limit: '10mb' });

router.post('/parseXml', textParser, (req, res) => {
  blast.blastParseXml(req.body)
  .then(parseJson)
  .then(res.send)
  .catch(err => res.status(500).send(err));
});

module.exports = router;

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
const fetch = require('isomorphic-fetch');
const queryString = require('query-string');
const biojsBlast = require('biojs-io-blast');

const logger = require('./logger');

const publicUrl = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi';
const constructorBlastUrl = 'https://gctor-blast.dev.bionano.autodesk.com/cgi-bin/blast.cgi';

const blastUrl = process.env.BLAST_URL || constructorBlastUrl;
const usingPublic = blastUrl === publicUrl;

console.log(`[BLAST] Url${usingPublic ? ' (public)' : ''}: ${blastUrl}`);

const fetchOpts = {
  mode: 'cors',
};

const blastDefaults = {
  CMD: 'Put',
  PROGRAM: 'blastn',
  DATABASE: 'nt',
};

// true -> yes
// null -> poll again
// reject -> there was an error
const parseBlastCheckResult = (text, rid) => {
  const statusResult = /Status=(.*)/gi.exec(text);
  const status = statusResult[1];

  logger(status, rid);

  if (status === 'READY') {
    return true;
    //true if there are hits, false if there are no hits
    //NB - local instance does not have the field ThereAreHits
    //return /ThereAreHits=yes/.test(text);
  } else if (status === 'WAITING') {
    return null;
  } else {
    return Promise.reject('there was an error');
  }
};

//given request id, see if blast results are ready
const checkBlastResult = requestId =>
  fetch(`${blastUrl}?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${requestId}`, fetchOpts)
  .then(resp => resp.text())
  .then(text => parseBlastCheckResult(text, requestId));

const fetchCompletedBlastResult = rid =>
  fetch(`${blastUrl}?CMD=Get&FORMAT_TYPE=XML&RID=${rid}`, fetchOpts)
  .then(resp => resp.text());

//poll for blast job, and resolve with:
// text -> XML
// or reject with error
function pollJob(rid, time = 20000) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      checkBlastResult(rid)
      .then((result) => {
        if (result === null) {
          return;
        }

        clearInterval(interval);

        if (result) {
          return resolve(fetchCompletedBlastResult(rid));
        }

        reject(result);
      })
      .catch((err) => {
        console.log(`error polling for RID ${rid}`);
        console.log(err);
        reject(err);
      });
    }, time);
  });
}

//get XML content
function blastId(id, options = {}) {
  const params = Object.assign({}, blastDefaults, options, { QUERY: id });
  const query = queryString.stringify(params);

  //TEST - we know this result is processed, just return based on known RID
  //this may need to change, as results expire after some period of time
  //const rid = 'CGXEVWV8016';
  //return pollJob(rid, 10000);

  return fetch(`${blastUrl}`, Object.assign({}, fetchOpts, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: query,
  }))
  .then(resp => resp.text())
  .then((text) => {
    //sometimes our query fails. we don't want to get into a nack cycle
    try {
      const result = /RID = (.*)/.exec(text);
      const rid = result[1];

      if (!rid) {
        throw new Error('received no RID');
      }

      const resultTime = /RTOE = (.*)/.exec(text);
      const rtoe = resultTime[1] * 1000;

      logger(`got RID ${rid}`);
      logger(`expected to take (sec): ${rtoe / 1000}`);

      return pollJob(rid);
    } catch (err) {
      console.log(`error running blast`);
      console.log(text);
      throw err;
    }
  });
}

function blastSequence(id, sequence, options = {}) {
  //make a fasta, pass as a query
  const fasta = `> ${id} (BLAST query)
${sequence}`;

  return blastId(fasta, options);
}

//returns promise
function blastParseUrl(url) {
  return biojsBlast.read(url);
}

function blastParseXml(xmlContent) {
  return biojsBlast.parse(xmlContent);
}


module.exports = {
  blastId,
  blastSequence,
  blastParseUrl,
  blastParseXml,
};


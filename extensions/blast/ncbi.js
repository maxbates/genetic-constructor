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

const ncbiEutilsUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

const fetchOpts = {
  mode: 'cors',
};

//fetching

function getSummary() {
  const ids = Array.prototype.slice.call(arguments);
  if (!ids.length) {
    return Promise.resolve([]);
  }

  const idList = ids.join(',');

  const url = `${ncbiEutilsUrl}esummary.fcgi?db=nuccore&id=${idList}&retmode=json`;

  return fetch(url, fetchOpts)
  .then(resp => resp.json())
  .then((json) => {
    //returns dictionary of UID -> ncbi entry, with extra key uids
    const results = json.result;
    delete results.uids;
    //return array of results
    return Object.keys(results).map(key => results[key]);
  })
  .catch((err) => {
    console.log(err); //eslint-disable-line no-console
    throw err;
  });
}

function getInstance(accessionVersion, parameters = {}) {
  const parametersMapped = Object.assign({
    db: 'nuccore',
    format: 'gb',
  }, parameters);

  const { db, format } = parametersMapped;

  const url = `${ncbiEutilsUrl}efetch.fcgi?db=${db}&id=${accessionVersion}&rettype=${format}&retmode=text`;

  return fetch(url, fetchOpts)
  .then(resp => resp.text())
  .then((text) => {
    //make sure we didnt get a 500 error from them
    if (text.indexOf('<!DOCTYPE') === 0) {
      return Promise.reject(text);
    }
    return text;
  })
  .catch((err) => {
    console.log(err); //eslint-disable-line no-console
    throw err;
  });
}

//returns a genbank string by default
function getGenbank(accessionVersion, parameters = {}) {
  return getInstance(accessionVersion, { format: 'gb' });
}

function getFasta(accessionVersion, parameters = {}) {
  return getInstance(accessionVersion, { format: 'fasta' });
}

//returns array of objects, of search results { uid, accessionversion, title, organism, slen, ... }
function search(query, options = {}) {
  //parameters we support, in this format
  const parameters = Object.assign({
    db: 'nuccore',
    sizeLimit: 0,
    start: 0,
    entries: 35,
  }, options);

  //mapped to NCBI syntax
  const mappedParameters = {
    db: parameters.db,
    retstart: parameters.start,
    retmax: parameters.entries,
    term: `${query}${parameters.sizeLimit > 0 ? '1:' + parameters.sizeLimit + '[SLEN]' : ''}`,
    retmode: 'json',
    sort: 'relevance',
  };

  const parameterString = queryString.stringify(mappedParameters);

  const url = `${ncbiEutilsUrl}esearch.fcgi?${parameterString}`;

  let count;

  return fetch(url, fetchOpts)
  .then(resp => resp.json())
  .then((json) => {
    count = json.esearchresult.count;
    return json.esearchresult.idlist;
  })
  .then(ids => getSummary(...ids))
  .then(results => Object.assign(results, { count, parameters }))
  .catch((err) => {
    console.log(err); //eslint-disable-line no-console
    throw err;
  });
}

module.exports = {
  search,
  getFasta,
  getGenbank,
  getSummary,
};

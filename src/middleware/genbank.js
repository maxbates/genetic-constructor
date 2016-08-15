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
import rejectingFetch from './rejectingFetch';
import invariant from 'invariant';
import { headersGet, headersPost, headersPut, headersDelete } from './headers';
import { extensionApiPath } from './paths';

const extensionKey = 'genbank';

const contentTypeTextHeader = { headers: { 'Content-Type': 'text/plain' } };

/**
 * import a genbank or CSV file into the given project or into a new project.
 * project ID is returned and should be reloaded if the current project or opened if a new project.
 * Promise resolves with projectId on success and rejects with statusText of xhr
 * @private
 */
export const importGenbankOrCSV = (file, projectId) => {
  invariant(file && file.name, 'expected a file object of the type that can be added to FormData');

  const formData = new FormData();
  formData.append('data', file, file.name);

  //hack - CSV should have its own middleware but so sparingly used we just put it here
  const isCSV = file.name.toLowerCase().endsWith('.csv');
  const extensionName = isCSV ? 'csv' : extensionKey;
  const uri = extensionApiPath(extensionName, `import${projectId ? ('/' + projectId) : ''}`);

  //define these here so content type not automatically applied so webkit can define its own boundry
  const headers = {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  };

  return rejectingFetch(uri, headers)
    .then(resp => resp.json())
    .then(json => {
      invariant(json && json.ProjectId, 'expect a project ID');
      return json.ProjectId;
    });
};

//convert without creating a project, but will save sequences
export const convertGenbank = (genbank, constructsOnly = false) => {
  const url = extensionApiPath('genbank', `import/convert${constructsOnly ? '?constructsOnly=true' : ''}`);
  return rejectingFetch(url, headersPost(genbank, contentTypeTextHeader))
    .then(resp => resp.json());
};

export const exportBlock = (projectId, constructId) => {
  const url = extensionApiPath(extensionKey, `export/${projectId}${constructId ? ('/' + constructId) : ''}`);
  return rejectingFetch(url, headersGet())
    .then(resp => resp.text());
};

export const exportProject = (projectId) => {
  const url = extensionApiPath(extensionKey, `export/${projectId}`);
  return rejectingFetch(url, headersGet())
    .then(resp => resp.text());
};

export const importFile = (genbankString, projectId) => {
  invariant(typeof genbankString === 'string', 'must pass a genbank file as text. to use a file, use importGenbankOrCSV.');

  const url = extensionApiPath(extensionKey, `import${projectId ? ('/' + projectId) : ''}`);
  return rejectingFetch(url, headersPost(genbankString, contentTypeTextHeader))
    .then(resp => resp.json());
};

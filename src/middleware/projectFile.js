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
import rejectingFetch from './utils/rejectingFetch';
import invariant from 'invariant';
import { headersGet, headersPost, headersDelete } from './utils/headers';
import { projectFilePath } from './utils/paths';

const contentTypeTextHeader = { headers: { 'Content-Type': 'text/plain' } };

/**
 * `constructor.extensions.files.read()`
 *
 * Get the contents of a project file
 *
 * @name files_read
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} extension Extension Key
 * @param {string} fileName Name of file
 * @returns {Promise} Fetch Response promise
 * @resolve {Response} Fetch Request. left for you to parse.
 * @reject {Error} rejects if > 400 or error
 */
export const readProjectFile = (projectId, extension, fileName) => {
  invariant(projectId, 'projectId is required');
  invariant(extension, 'extension key is required');
  invariant(fileName, 'file name is required');

  return rejectingFetch(projectFilePath(projectId, extension, fileName), headersGet(contentTypeTextHeader));
};

/**
 * `constructor.extensions.files.write()`
 *
 * Set the contents of a project file, or delete a file
 *
 * @name files_write
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} extension Extension Key
 * @param {string} fileName Name of file
 * @param {string|null} contents String of contents for file. if contents === null, then the file is deleted
 * @returns {Promise} Fetch Response promise
 * @resolve {string} URL if successful, or empty string if successfully deleted
 * @reject {Error} rejects if > 400 or error
 */
export const writeProjectFile = (projectId, extension, fileName, contents) => {
  invariant(projectId, 'projectId is required');
  invariant(extension, 'extension key is required');
  invariant(fileName, 'file name is required');

  const filePath = projectFilePath(projectId, extension, fileName);

  if (contents === null) {
    return rejectingFetch(filePath, headersDelete());
  }

  return rejectingFetch(filePath, headersPost(contents, contentTypeTextHeader));
};
/**
 * `constructor.extensions.files.list()`
 *
 * List the files for an extension.
 *
 * @name files_list
 * @function
 * @memberOf module:constructor.module:extensions
 * @param {UUID} projectId Project ID to which user has access
 * @param {string} extension Extension Key
 * @returns {Promise} Fetch Response promise
 * @resolve {string} URL if successful, or empty string if successfully deleted
 * @reject {Error} rejects if > 400 or error
 */
export const listProjectFiles = (projectId, extension) => {
  invariant(projectId, 'projectId is required');
  invariant(extension, 'must pass an extension');

  return rejectingFetch(projectFilePath(projectId, extension, ''), headersGet())
    .then(resp => resp.text());
};

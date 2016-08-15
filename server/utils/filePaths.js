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
import path from 'path';
import invariant from 'invariant';

const makePath = (...paths) => {
  if (process.env.STORAGE) {
    return path.resolve(process.env.STORAGE, ...paths);
  } else if (process.env.BUILD) {
    return path.resolve(__dirname, '../storage/', ...paths);
  }

  return path.resolve(__dirname, '../../storage/', ...paths);
};

export const trashPath = 'trash';
export const filePath = 'file';
export const sequencePath = 'sequence';
export const blockPath = 'blocks';
export const projectPath = 'projects';
export const projectDataPath = 'data';
export const orderPath = 'orders';
export const projectFilesPath = 'files';

export const manifestFilename = 'manifest.json';
export const permissionsFilename = 'permissions.json';
export const permissionsDeletedFileName = 'priorOwner.json';

//All files are put in the storage folder (until platform comes along)
export const createStorageUrl = (...urls) => {
  const dev = ((process.env.NODE_ENV === 'test') ? 'test/' : '');
  return makePath(dev, ...urls);
};

/***** files *****/

export const createFilePath = (path) => {
  return createStorageUrl(filePath, path);
};

/***** data *****/

// TRASH

export const createTrashPath = (...paths) => createStorageUrl(trashPath, ...paths);

//PROJECTS

export const createProjectsDirectoryPath = () => createStorageUrl(projectPath);

export const createProjectPath = (projectId, ...rest) => {
  invariant(projectId, 'Project ID required');
  return createStorageUrl(projectPath, projectId, ...rest);
};

export const createProjectDataPath = (projectId, ...rest) => {
  return createProjectPath(projectId, projectDataPath, ...rest);
};

export const createProjectPermissionsPath = (projectId) => {
  return createProjectPath(projectId, permissionsFilename);
};

export const createProjectManifestPath = (projectId) => {
  return createProjectDataPath(projectId, manifestFilename);
};

//BLOCKS

export const createBlockDirectoryPath = (projectId, ...rest) => {
  return createProjectDataPath(projectId, blockPath, ...rest);
};

export const createBlockManifestPath = (projectId, blockId) => {
  return createBlockDirectoryPath(projectId, manifestFilename);
};

//ORDERS

// projects/<projectId>/orders
export const createOrderDirectoryPath = (projectId, ...rest) => {
  return createProjectPath(projectId, orderPath, ...rest);
};

// projects/<projectId>/orders/<orderId>
export const createOrderPath = (orderId, projectId, ...rest) => {
  invariant(orderId, 'Order ID required');
  invariant(projectId, 'Project ID required');
  return createOrderDirectoryPath(projectId, orderId, ...rest);
};

//orders dont have their own directory, they are just files named by orderId
export const createOrderManifestPath = (orderId, projectId) => {
  return createOrderPath(orderId, projectId, manifestFilename);
};

export const createOrderProjectManifestPath = (orderId, projectId) => {
  return createOrderPath(orderId, projectId, 'project.json');
};

//SEQUENCE

export const createSequencePath = (md5) => {
  return createStorageUrl(sequencePath, md5);
};

// PROJECT FILES

export const createProjectFilesDirectoryPath = (projectId, ...rest) => {
  return createProjectDataPath(projectId, projectFilesPath, ...rest);
};

export const createProjectFilePath = (projectId, extension, fileName) => {
  invariant(extension, 'must pass a directory name (extension key)');
  return createProjectFilesDirectoryPath(projectId, extension, fileName);
};

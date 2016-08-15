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
import * as blockSelectors from './blocks';

const _getCurrentProjectId = () => {
  const match = /^\/project\/(.*?)\??$/gi.exec(window.location.pathname);
  return match ? match[1] : null;
};

const _getProjectFromStore = (projectId, store) => {
  if (!projectId) {
    return null;
  }
  return store.projects[projectId];
};

export const projectGet = (projectId) => {
  return (dispatch, getState) => {
    return _getProjectFromStore(projectId, getState());
  };
};

//get the focused project from the URL, since react-router is only accessible in react components
export const projectGetCurrentId = () => {
  return (dispatch, getState) => {
    return _getCurrentProjectId();
  };
};

export const projectGetVersion = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    return !!project ? project.version : null;
  };
};

//note - does not include options
export const projectListAllComponents = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());

    return project.components.reduce((acc, componentId) => {
      acc.push(dispatch(blockSelectors.blockGet(componentId)));
      const constructChildren = dispatch(blockSelectors.blockGetComponentsRecursive(componentId));
      acc.push(...constructChildren);
      return acc;
    }, []);
  };
};

//note - does not include components
export const projectListAllOptions = (projectId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    const optionIds = components.reduce((acc, comp) => acc.concat(Object.keys(comp.options)), []);
    return optionIds.map(id => dispatch(blockSelectors.blockGet(id)));
  };
};

//all contents
export const projectListAllBlocks = (projectId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    const options = dispatch(projectListAllOptions(projectId));
    return components.concat(options);
  };
};

export const projectHasComponent = (projectId, blockId) => {
  return (dispatch, getState) => {
    const components = dispatch(projectListAllComponents(projectId));
    return components.map(comp => comp.id).includes(blockId);
  };
};

export const projectHasOption = (projectId, blockId) => {
  return (dispatch, getState) => {
    const options = dispatch(projectListAllOptions(projectId));
    return options.map(option => option.id).includes(blockId);
  };
};

//check if a block with { source: { source: sourceKey, id: sourceId } } is present in the project (e.g. so dont clone it in more than once)
//only checks options, since if its a component we should clone it
//returns block if exists, or null
export const projectGetOptionWithSource = (projectId, sourceKey, sourceId) => {
  return (dispatch, getState) => {
    invariant(sourceKey && sourceId, 'source key and ID are required');
    const options = dispatch(projectListAllOptions(projectId));
    return options.find(option => option.source.source === sourceKey && option.source.id === sourceId) || null;
  };
};

export const projectCreateRollup = (projectId) => {
  return (dispatch, getState) => {
    const project = _getProjectFromStore(projectId, getState());
    if (!project) {
      return null;
    }

    const blocks = dispatch(projectListAllBlocks(projectId))
      .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});

    return {
      project,
      blocks,
    };
  };
};

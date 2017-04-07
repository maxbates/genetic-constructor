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
import bodyParser from 'body-parser';
import express from 'express';

import { errorDoesNotExist, errorInvalidModel, errorInvalidRoute, errorNotPublished, errorIsPublished } from '../errors/errorConstants';
import { projectIdParamAssignment, ensureReqUserMiddleware, userOwnsProjectMiddleware } from './permissions';
import * as blockPersistence from './persistence/blocks';
import * as projectVersions from './persistence/projectVersions';
import * as projectPersistence from './persistence/projects';
import * as commons from './persistence/commons';
import projectFileRouter from './routerProjectFiles';
import sequenceRouter from './routerSequences';
import snapshotRouter from './routerSnapshots';
import loaderSupportRouter from './routerLoaderSupport';
import commonsRouter from './routerCommons';
import mostRecentProject from '../utils/mostRecentProject';

const router = express.Router(); //eslint-disable-line new-cap
const jsonParser = bodyParser.json({
  strict: false, //allow values other than arrays and objects,
  limit: 20 * 1024 * 1024,
});

/******** MIDDLEWARE ***********/

router.use(jsonParser);

//ensure req.user is set
router.use(ensureReqUserMiddleware);

/******** PARAMS ***********/

router.param('projectId', projectIdParamAssignment);

router.param('blockId', (req, res, next, id) => {
  Object.assign(req, { blockId: id });
  next();
});

router.param('version', (req, res, next, id) => {
  Object.assign(req, { version: id });
  next();
});

/********** ROUTES ***********/

router.use('/commons', commonsRouter);

router.use('/sequence', sequenceRouter);

router.use('/loadersupport', loaderSupportRouter);

/* project files */
router.use('/file/:projectId', userOwnsProjectMiddleware, projectFileRouter);

/* versioning */
router.route('/versions/:projectId/:version?')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  //pass the version you want, otherwise send version history
  const { projectId, version } = req;

  if (version) {
    projectVersions.projectVersionGet(projectId, version)
    .then(project => res.status(200).json(project))
    .catch(err => next(err));
  } else {
    projectVersions.projectVersionList(projectId)
    .then(log => res.status(200).json(log))
    .catch(err => next(err));
  }
});

router.use('/snapshots/', snapshotRouter);

/* info queries */

router.route('/info/:type/:detail?/:additional?')
.get((req, res, next) => {
  const { user } = req;
  const { type, detail, additional } = req.params;

  switch (type) {
    case 'role' :
      if (detail) {
        blockPersistence.getAllPartsWithRole(user.uuid, detail)
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      } else {
        blockPersistence.getAllBlockRoles(user.uuid)
        .then(info => res.status(200).json(info))
        .catch(err => next(err));
      }
      break;
    case 'name' :
      blockPersistence.getAllBlocksWithName(user.uuid, detail)
      .then(info => res.status(200).json(info))
      .catch(err => next(err));
      break;
    case 'contents' :
      projectPersistence.userOwnsProject(user.uuid, additional)
      .then(() => projectPersistence.projectGet(additional))
      .then(rollup => rollup.getContents(detail))
      .then(info => res.status(200).json(info))
      .catch(err => next(err));
      break;
    case 'components' :
      projectPersistence.userOwnsProject(user.uuid, additional)
      .then(() => projectPersistence.projectGet(additional))
      .then(rollup => rollup.getComponents(detail))
      .then(info => res.status(200).json(info))
      .catch(err => next(err));
      break;
    case 'options' :
      projectPersistence.userOwnsProject(user.uuid, additional)
      .then(() => projectPersistence.projectGet(additional))
      .then(rollup => rollup.getOptions(detail))
      .then(info => res.status(200).json(info))
      .catch(err => next(err));
      break;
    default :
      res.status(404).send(`must specify a valid info type in url, got ${type} (param: ${detail})`);
  }
});

/* rollups */

// routes for non-atomic operations
// response/request with data in rollup format {project: {}, blocks: {}, ...}
// e.g. used in autosave, loading / saving whole project

router.route('/projects/:projectId')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  const { projectId } = req;

  projectPersistence.projectGet(projectId)
  .then(roll => res.status(200).json(roll))
  .catch(next);
})
.post((req, res, next) => {
  const { projectId, user } = req;
  const roll = req.body;

  projectPersistence.projectWrite(projectId, roll, user.uuid)
  .then(info => res.status(200).json({
    version: info.version,
    updated: info.updated,
    id: info.id,
  }))
  .catch(next);
})
.delete((req, res, next) => {
  const { projectId, user, projectDoesNotExist } = req;
  const forceDelete = !!req.query.force;

  if (projectDoesNotExist === true) {
    return res.status(404).send(errorDoesNotExist);
  }

  //check if the project has been published, and prevent if it is
  commons.checkProjectPublic(projectId)
  .then((isPublished) => {
    if (isPublished) {
      return Promise.reject(errorIsPublished);
    }
    return true;
  })
  .catch((err) => {
    if (err === errorNotPublished) {
      return true;
    }
    return Promise.reject(err);
  })
  .then(() => projectPersistence.projectDelete(projectId, user.uuid, forceDelete))
  .then(() => res.status(200).json({ projectId }))
  .catch(next);
});

//separate route because dont use project permission middleware
router.route('/projects')
.all(ensureReqUserMiddleware)
.get((req, res, next) => {
  const { user } = req;

  return projectPersistence.getUserProjects(user.uuid, false)
  .then(rolls => rolls.map(roll => roll.project))
  .then((manifests) => {
    res.set('Last-Project-ID', mostRecentProject(manifests).id);
    return res.status(200).json(manifests);
  })
  .catch(err => next(err));
});

/*
 In general:

 PUT - replace
 POST - merge
 */

router.route('/:projectId/:blockId')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  const { projectId, blockId } = req;

  projectPersistence.blockGet(projectId, blockId)
  .then((result) => {
    if (!result) {
      return res.status(204).json(null);
    }
    res.json(result);
  })
  .catch(next);
})
.put((req, res, next) => {
  const { user, projectId, blockId } = req;
  const block = req.body;

  if (!!block.id && block.id !== blockId) {
    return res.status(422).send(errorInvalidModel);
  }

  projectPersistence.blocksPatch(projectId, user.uuid, { [blockId]: block })
  .then((result) => {
    res.json(result.blocks[blockId]);
  })
  .catch(next);
})
.post((req, res, next) => {
  const { user, projectId, blockId } = req;
  const block = req.body;

  //will be forced downstream, but worth alerting requester
  if (!!block.id && block.id !== blockId) {
    return res.status(400).send('IDs do not match');
  }

  projectPersistence.blocksMerge(projectId, user.uuid, { [blockId]: block })
  .then((result) => {
    res.json(result.blocks[blockId]);
  })
  .catch(next);
})
.delete((req, res, next) => res.status(405).send());

router.route('/:projectId')
.all(userOwnsProjectMiddleware)
.get((req, res, next) => {
  const { projectId } = req;
  //const { depth } = req.query; //future

  projectPersistence.projectGetManifest(projectId)
  .then((result) => {
    res.json(result);
  })
  .catch(next);
})
.put((req, res, next) => {
  res.status(405).send('cannot PUT project manifest, only post to update existing');
})
.post((req, res, next) => {
  const { projectId, user } = req;
  const project = req.body;

  if (!!project.id && project.id !== projectId) {
    return res.status(400).send('IDs do not match');
  }

  projectPersistence.projectWriteManifest(projectId, project, user.uuid)
  .then(merged => res.status(200).send(merged))
  .catch(next);
})
.delete((req, res, next) => res.status(405).send('use DELETE /projects/:id'));

//default catch
router.use('*', (req, res) => {
  res.status(404).send(errorInvalidRoute);
});

export default router;

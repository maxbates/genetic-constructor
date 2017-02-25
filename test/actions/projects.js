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

import { assert, expect } from 'chai';
import _ from 'lodash';
import * as blockActions from '../../src/actions/blocks';
import * as actions from '../../src/actions/projects';
import * as selectors from '../../src/selectors/projects';
import configureStore from '../../src/store/configureStore';
import Project from '../../src/models/Project';

describe('Actions', () => {
  describe('Projects', () => {
    let store;
    let block;
    let project;

    before(() => {
      store = configureStore();
      block = store.dispatch(blockActions.blockCreate());
    });

    it('projectCreate() makes a project', () => {
      project = store.dispatch(actions.projectCreate());

      assert(Project.validate(project), 'should be valid');
      expect(store.getState().projects[project.id]).to.equal(project);
    });

    it('projectAddConstruct adds component, sets projectId', () => {
      project = store.dispatch(actions.projectAddConstruct(project.id, block.id));
      expect(project.components).to.eql([block.id]);

      block = store.getState().blocks[block.id];
      expect(block.projectId).to.equal(project.id);
    });

    describe('Files', () => {
      const namespace = 'testSpace';
      const fileName = 'myFile';
      const fileContents = 'blah' + Math.random();

      it('projectFileWrite() updates the project', () => {
        assert(project.files.length === 0, 'should have no files');
        return store.dispatch(actions.projectFileWrite(project.id, namespace, fileName, fileContents))
        .then(proj => {
          project = proj;
          assert(project.files.length === 1, 'should have updated files');
          assert(project.files[0].namespace === namespace, 'should have same namespace');
          assert(project.files[0].name === fileName, 'should have name as file name');
        });
      });

      it('projectFileRead() gets the file', () => {
        return store.dispatch(selectors.projectFileRead(project.id, namespace, fileName))
        .then(contents => {
          expect(contents).to.equal(fileContents);
        });
      });
    });

    describe('Cloning', () => {
      expect(project).to.be.defined;

      it('projectClone() clones the project', () => {
        expect(block.projectId).to.equal(project.id);
        const clone = store.dispatch(actions.projectClone(project.id));
        assert(clone && clone.project && clone.blocks, 'should return roll');

        const clonedProject = clone.project;
        expect(clonedProject.id).to.not.equal(project.id);
        expect(clonedProject.components).to.eql(project.components);
        expect(clonedProject.parents.length).to.equal(1);
        expect(clonedProject.parents[0].id).to.equal(project.id);
        expect(clonedProject).to.eql(_.merge({}, project, { parents: clonedProject.parents, id: clonedProject.id }));
      });

      it('projectClone() can clone all the blocks as well', () => {
        const clone = store.dispatch(actions.projectClone(project.id, true));
        const clonedProject = clone.project;

        expect(clonedProject.components).to.not.eql(project.components);

        const constructClone = store.getState().blocks[clonedProject.components[0]];
        assert(constructClone === clone.blocks[clonedProject.components[0]], 'store and cloned block should match');

        expect(constructClone.projectId).to.equal(clonedProject.id);
        expect(constructClone.id).to.not.equal(block.id);
        expect(constructClone.parents[0].id).to.equal(block.id);
        expect(constructClone.parents[0].projectId).to.equal(project.id);
      });
    });
  });
});

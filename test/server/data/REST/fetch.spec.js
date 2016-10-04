import { expect } from 'chai';
import fetch from 'isomorphic-fetch';
import Project from '../../../../src/models/Project';
import { dataApiPath } from '../../../../src/middleware/utils/paths';
import { updateProjectWithAuthor } from '../../../utils/userUtils';

//noinspection ES6UnusedImports
import devServer from '../../../../server/server'; // starts the server which will be accessed by methods below

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('fetch', function fetchTest() {
        it('basic test', () => {
          const testProject = new Project({
            notes: {
              some: 'note',
            },
          });

          return fetch(dataApiPath(`${testProject.id}`), {
            method: 'put',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProject),
          })
            .then(res => {
              expect(res.status).to.equal(200);
              return res.json();
            })
            .then(json => {
              expect(json).to.eql(updateProjectWithAuthor(testProject));
            });
        });
      });
    });
  });
});

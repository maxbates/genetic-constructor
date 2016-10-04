import { assert, expect } from 'chai';
import request from 'supertest';
import { testUserId } from '../../../constants';
import Block from '../../../../src/models/Block';
import * as rollup from '../../../../server/data/rollup';
import devServer from '../../../../server/server';
import { numberBlocksInRollup, createExampleRollup } from '../../../utils/rollup';
import { range, merge } from 'lodash';

describe('Server', () => {
  describe('Data', () => {
    describe('REST', () => {
      describe('Info', () => {
        let server;
        const userId = testUserId;

        const roll = createExampleRollup();

        const project = roll.project;
        const projectId = project.id;
        const blockKeys = Object.keys(roll.blocks);
        const parentId = blockKeys.find(blockId => {
          const block = roll.blocks[blockId];
          return block.components.length === 3;
        });

        //add 5 weird role type blocks to roll
        const numberEsotericRole = 5;
        const esotericRole = 'sdlfkjasdlfkjasdf';
        const blocks = range(numberEsotericRole)
          .map(() => Block.classless({
            projectId,
            rules: { role: esotericRole },
          }))
          .reduce((acc, block) => Object.assign(acc, { [block.id]: block }), {});
        merge(roll.blocks, blocks);

        before(() => {
          return rollup.writeProjectRollup(projectId, roll, userId);
        });

        beforeEach('server setup', () => {
          server = devServer.listen();
        });
        afterEach(() => {
          server.close();
        });

        it('/info/FAKE returns 404', (done) => {
          const url = `/data/info/notReal`;
          request(server)
            .get(url)
            .expect(404, done);
        });

        it('/info/role returns map of role types present', (done) => {
          const url = `/data/info/role`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              const { body } = result;
              expect(typeof body).to.equal('object');
              expect(body[esotericRole]).to.equal(numberEsotericRole);
            })
            .end(done);
        });

        it('/info/role/type returns matching blocks', (done) => {
          const url = `/data/info/role/${esotericRole}`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              expect(result.body.length).to.equal(numberEsotericRole);
            })
            .end(done);
        });

        it('/info/components/id returns map of components', (done) => {
          const url = `/data/info/components/${parentId}/${projectId}`;
          request(server)
            .get(url)
            .expect(200)
            .expect(result => {
              const { body } = result;
              const keys = Object.keys(body);
              expect(keys.length).to.equal(numberBlocksInRollup);
              assert(keys.every(key => Object.keys(roll.blocks).indexOf(key) >= 0), 'got wrong key, outside roll');
            })
            .end(done);
        });

      });
    });
  });
});

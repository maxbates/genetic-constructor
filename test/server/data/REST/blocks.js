import { expect } from 'chai';
import request from 'supertest';
import Project from '../../../../src/models/Project';
import Block from '../../../../src/models/Block';
import * as persistence from '../../../../server/data/persistence';
import devServer from '../../../../server/devServer';

describe('REST', () => {
  describe('Data', () => {
    describe.only('Blocks', () => {
      let server;
      const projectData = new Project();
      const projectId = projectData.id;

      const blockData = new Block();
      const blockId = blockData.id;

      const extendedBlock = blockData.merge({
        some: 'field',
      });

      before(() => {
        return persistence.projectCreate(projectId, projectData)
          .then(() => persistence.blockCreate(blockId, blockData, projectId));
      });

      beforeEach('server setup', () => {
        server = devServer.listen();
      });
      afterEach(() => {
        server.close();
      });

      it('GET a not real block returns null and a 204', (done) => {
        const url = `/data/${projectId}/fakeId`;
        request(server)
          .get(url)
          .expect(204)
          .expect(result => {
            expect(result.body).to.be.null;
          })
          .end(done);
      });

      it('GET an existing block returns the block', (done) => {
        const url = `/data/${projectId}/${blockId}`;
        request(server)
          .get(url)
          .expect(200)
          .expect(result => {
            expect(result.body).to.eql(blockData);
          })
        .end(done);
      });
    });
  });
});

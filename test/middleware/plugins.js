import { assert, expect } from 'chai';
import fs from 'fs';
import * as api from '../../src/middleware/data';
import { exportBlock, importFile, importGenbankOrCSV } from '../../src/middleware/genbank';

describe('Middleware', () => {
  describe('Plugins', () => {
    it.skip('exportBlock() should be able convert Block to Genbank', function testFunc(done) {
      fs.readFile('./test/res/sampleBlocks.json', 'utf8', (err, sampleBlocksJson) => {
        const sampleBlocks = JSON.parse(sampleBlocksJson);
        exportBlock('genbank', sampleBlocks)
          .then(result => {
            expect(result.indexOf('acggtt') !== -1).to.equal(true);
            expect(result.indexOf('block           5..6') !== -1).to.equal(true);
            done();
          })
          .catch(err => {
            done(err);
          });
      });
    });

    it.skip('importGenbankOrCSV() should be able convert a genbank file to a project and add a construct to it', function testFunc(done) {
      const file = new File('./test/res/sampleGenbank.gb');
      importGenbankOrCSV(file)
        .then(result => {
          expect(result.ProjectId === undefined).to.equal(false);
          return api.loadProject(result.ProjectId)
            .then(gotRoll => {
              expect(gotRoll.project.metadata.name).to.equal('EU912544');
              expect(gotRoll.project.components.length).to.equal(1);
              expect(gotRoll.blocks.length).to.equal(8); // There are 8 blocks in that file
              // Now add a construct to it...
              fs.readFile('./test/res/sampleGenbankContiguous.gb', 'utf8', (err, sampleStrConstruct) => {
                importFile(sampleStrConstruct, result.ProjectId)
                  .then(data => {
                    // This just tests that the api works as expected. The tests about the particular
                    // Genbank conversions to and from blocks are in the genbank.spec.js file
                    return api.loadProject(result.ProjectId)
                      .then(secondRoll => {
                        expect(secondRoll.project.metadata.name).to.equal('EU912544');
                        expect(secondRoll.project.components.length).to.equal(2);
                        done();
                      });
                  })
                  .catch(err => {
                    console.log('ERROR!!!');
                    console.log(err);
                    done(err);
                  });
              });
            })
            .catch(err => {
              done(err);
            });
        });
    });
  });
});


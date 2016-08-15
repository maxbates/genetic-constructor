import md5 from 'md5';
import { range } from 'lodash';
import Project from '../../src/models/Project';
import Block from '../../src/models/Block';
import rollupFromArray from '../../src/utils/rollup/rollupFromArray';
import { generateRandomSequence } from '../utils/sequence';

export const numberBlocksInRollup = 7;

/*
 Returns a Rollup in the form { project: project, blocks: {P,A,B,C,D,E,F} }
 parent most block has 3 components so easier to find
 */
export const createExampleRollup = () => {
  /**
   *
   *     project
   *       |
   *       P
   *  /----|-----\
   *  A     B    F
   * /-\   |
   * C  D  E
   */

  const blockC = Block.classless();
  const blockD = Block.classless();
  const blockE = Block.classless();
  const blockF = Block.classless();
  const blockB = Block.classless({
    components: [blockE.id],
  });
  const blockA = Block.classless({
    components: [blockC.id, blockD.id],
  });
  const blockP = Block.classless({
    components: [blockA.id, blockB.id, blockF.id],
  });
  const project = Project.classless({
    components: [blockP.id],
  });

  const blocks = [blockP, blockA, blockB, blockC, blockD, blockE, blockF];

  //assign the project ID, as it should be there anyway, and will be there after writing
  blocks.forEach(block => Object.assign(block, { projectId: project.id }));

  const roll = rollupFromArray(project, ...blocks);
  return roll;
};

//note - slightly abnormal signature (since for tests), returns sequences on the rollup as well
/*
 * project
 * |
 * A
 * |
 * B*-C*-D*-E*-F*-G*
 */
export const createSequencedRollup = () => {
  const numSeqs = numberBlocksInRollup - 1;
  const sequences = range(numSeqs).map(() => generateRandomSequence());
  const sequenceMd5s = sequences.map(seq => md5(seq));
  const sequenceMap = sequenceMd5s.reduce((acc, seqMd5, index) => {
    return Object.assign(acc, { [seqMd5]: sequences[index] });
  }, {});

  const blocks = range(numSeqs).map((index) => Block.classless({
    sequence: {
      md5: sequenceMd5s[index],
    },
  }));

  const construct = Block.classless({
    components: blocks.map(block => block.id),
  });

  const project = Project.classless({
    components: [construct.id],
  });

  const roll = rollupFromArray(project, ...blocks, construct);
  Object.assign(roll, { sequences: sequenceMap });
  return roll;
};

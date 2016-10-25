import chai from 'chai';
import * as api from '../../src/middleware/data';
const { assert, expect } = chai;
import { createFilePath } from '../../server/data/middleware/filePaths';

const makeStoragePath = (path) => createFilePath(path);

describe('Middleware', () => {
describe('Sequence', () => {
  it('getSequence() accepts an md5');
  it('writeSequence() writes a sequence');
  });
});

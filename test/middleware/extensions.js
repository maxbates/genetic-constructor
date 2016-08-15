import chai from 'chai';
import fs from 'fs';
import * as extensionsApi from '../../src/middleware/extensions';
const { assert, expect } = chai;

describe('Middleware', () => {
  describe('Extensions', () => {
    it('getExtensionsInfo() should be able get extension manifests', () => {
      return extensionsApi.getExtensionsInfo()
        .then(output => {
          assert(typeof output === 'object', 'wrong format for info');
          assert(Object.keys(output).every(key => {
            const manifest = output[key];
            return manifest.name && manifest.version && (manifest.geneticConstructor.region || manifest.geneticConstructor.region === null);
          }), 'some extensions are not in correct format');
        });
    });
  });
});


import { expect, assert } from 'chai';
import Project from '../../src/models/Project';
import sha from 'sha1';
import { isEqual } from 'lodash';

describe('Model', () => {
  describe('Project', () => {
    it('doesnt have version by default', () => {
      const proj = new Project();
      assert(!proj.version, 'shouldnt scaffold version');
    });

    it('accepts initial model', () => {
      const existing = {
        metadata: {
          name: 'blah',
        },
      };
      const inst = new Project(existing);

      expect(inst.metadata.name).to.equal('blah');
    });

    it('Project.classless(input) creates unfrozen JSON object, no instance methods', () => {
      const instance = Project.classless({
        rules: { someRule: 'yep' },
      });

      expect(instance.id).to.be.defined;
      expect(instance.rules.someRule === 'yep');
      expect(instance.merge).to.be.undefined;
      expect(instance.addComponents).to.be.undefined;
      expect(() => Object.assign(instance, { id: 'newId' })).to.not.throw();
      expect(instance.id).to.equal('newId');
    });

    it('updateVersion() updates version', () => {
      const proj = new Project();
      assert(!proj.version, 'shouldnt scaffold version');
      const versionSha = sha('sadf');
      const updated = proj.updateVersion(versionSha);
      assert(updated.version === versionSha);
    });

    //todo - deprecate this test? will the client know what version it wants the projec to be?
    it('Project.compare() does equality check, ignoring version + updated', () => {
      const v1 = sha('one');
      const v2 = sha('two');

      const one = new Project({ version: v1 });
      const two = one.updateVersion(v2);

      assert(one !== two);
      assert(!isEqual(one, two));
      assert(Project.compare(one, two), 'compare should ignore version');
    });
  });
});

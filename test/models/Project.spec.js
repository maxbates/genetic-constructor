import { expect, assert } from 'chai';
import { merge, isEqual } from 'lodash';
import Project from '../../src/models/Project';
import { testUserId } from '../constants';

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

    it('validate can throw, or not', () => {
      const good = Project.classless({ owner: testUserId });
      const bad = merge({}, good, { version: 'adsfasdfasdfasdf' });

      expect(Project.validate(good)).to.equal(true);
      expect(Project.validate(bad)).to.equal(false);

      expect(() => Project.validate(good, true)).to.not.throw();
      expect(() => Project.validate(bad, true)).to.throw();
    });

    it('compare() can throw, or not', () => {
      const orig = new Project();
      const copy = orig.clone(null).mutate('id', orig.id);
      const diff = orig.mutate('metadata.name', 'new name');

      expect(Project.compare(orig, orig)).to.equal(true);

      expect(Project.compare(orig, copy)).to.equal(true);
      expect(() => Project.compare(orig, copy, true)).to.not.throw();

      expect(Project.compare(orig, diff)).to.equal(false);
      expect(() => Project.compare(orig, diff, true)).to.throw();
    });

    it('compare() compares model and POJO correctly', () => {
      const orig = new Project();
      const clone = orig.clone(null).mutate('id', orig.id);
      const copy = Object.assign({}, orig);

      //both project instances
      Project.compare(orig, clone, true);

      //both same data, one Project one POJO
      Project.compare(orig, copy, true);
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
      const version = 19;
      const updated = proj.updateVersion(version);
      assert(updated.version === version);
    });

    it('Project.compare() does equality check, ignoring version + updated', () => {
      const v1 = 124;
      const v2 = 241;

      const one = new Project({ version: v1 });
      const two = one.updateVersion(v2);

      assert(one !== two);
      assert(!isEqual(one, two));
      assert(Project.compare(one, two), 'compare should ignore version');
    });


    it('Project.clone() null just clones with no parents, changes ID', () => {
      const init = new Project();
      const clone = init.clone(null);

      expect(clone.id).to.not.equal(init.id);
      expect(clone).to.eql(Object.assign({}, init, { id: clone.id }));
    });

    it('Project.clone() unlocks frozen project', () => {
      const init = new Project({ rules: { frozen: true }});
      const clone = init.clone(null);
      expect(clone.rules.frozen).to.equal(false);
    });

    //todo - re-enable pending
    it.skip('Project.clone() requires an owner if not a simple copy', () => {
      expect(() => (new Project()).clone()).to.throw();
    });

    it('Project.clone() adds ancestor properly', () => {
      const init = new Project({ owner: testUserId });
      const clone = init.clone();

      expect(clone.id).to.not.equal(init.id);
      expect(clone.parents.length).to.equal(1);
      expect(clone.parents[0].id).to.equal(init.id);
      expect(clone.parents[0].version).to.equal(init.version);
      expect(clone.parents[0].owner).to.equal(init.owner);
      expect(clone).to.eql(merge({}, init, { parents: clone.parents, id: clone.id }));
    });
  });
});

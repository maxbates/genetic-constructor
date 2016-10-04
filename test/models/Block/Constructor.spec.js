import { expect, assert } from 'chai';
import Block from '../../../src/models/Block';

describe('Model', () => {
  describe('Block', () => {
    describe('Constructor', () => {
      let block;
      beforeEach(() => {
        block = new Block();
      });

      it('accepts initial model', () => {
        const existing = {
          metadata: {
            name: 'blah',
          },
        };
        const inst = new Block(existing);

        expect(inst.metadata.name).to.equal('blah');
      });

      it('Block.classless(input) creates unfrozen JSON object, no instance methods', () => {
        const instance = Block.classless({
          rules: { role: 'promoter' },
        });
        expect(instance.id).to.be.defined;
        expect(instance.rules.role === 'promoter');
        expect(instance.merge).to.be.undefined;
        expect(instance.clone).to.be.undefined;
        expect(instance.getName).to.be.undefined;
        expect(() => Object.assign(instance, { id: 'newId' })).to.not.throw();
        expect(instance.id).to.equal('newId');
      });
    });
  });
});

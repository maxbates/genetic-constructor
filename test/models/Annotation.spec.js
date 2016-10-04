import { expect, assert } from 'chai';
import Annotation from '../../src/models/Annotation';
import AnnotationSchema from '../../src/schemas/Annotation';
import merge from 'lodash.merge';

describe('Model', () => {
  describe('Annotation', () => {
    let annotation;
    beforeEach(() => {
      annotation = new Annotation();
    });

    it('should have a default color', () => {
      assert(annotation.color, 'should have a color');
    });
  });
});

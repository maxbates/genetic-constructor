import Instance from './Instance';
import invariant from '../utils/environment/invariant';
import randomColor from '../utils/generators/color';
import { saveBlock, readFile, writeFile } from '../middleware/api';
import AnnotationDefinition from '../schemas/Annotation';

const sequenceFilePathFromId = (id) => `block/${id}/sequence/`;

//todo - should scaffold, not pass manually

export default class Block extends Instance {
  constructor(...args) {
    super(...args, {
      metadata: {
        color: randomColor(),
      },
      sequence: {
        annotations: [],
      },
      source: {},
      rules: {},
      options: [],
      components: [],
      notes: {},
    });
  }

  save() {
    return saveBlock(this);
  }

  addComponent(component, index) {
    const spliceIndex = Number.isInteger(index) ? index : this.components.length;
    const newComponents = this.components.slice();
    newComponents.splice(spliceIndex, 0, component);
    return this.mutate('components', newComponents);
  }

  setSbol(sbol) {
    return this.mutate('rules.sbol', sbol);
  }

  /**
   * @description Retrieve the sequence of the block. Retrieves the sequence from the server, since it is stored in a file, returning a promise.
   * @param format {String} accepts 'raw', 'fasta', 'genbank'
   * @returns {Promise} Promise which resolves with the sequence value, or rejects with null if no sequence is associated.
   */
  getSequence(format = 'raw') {
    const hasSequence = typeof this.sequence === 'string' && this.sequence.length;
    const sequencePath = sequenceFilePathFromId(this.sequence) + `?format=${format}`;

    return hasSequence ?
      readFile(sequencePath) :
      Promise.reject(null);
  }

  /**
   * @description Set the sequence of the block.
   *
   * future - tie in to history
   *
   * @param sequence {String} ACTG representation of the sequence. Annotations should be parsed and stored in the block directly in `annotations`.
   * @returns block {Block} New block with the potentially-updated sequence file path
   */
  setSequence(sequence) {
    //If we are editing the sequence, or sequence doesn't exist, we want to set the sequence for the child block, not change the sequence of the parent part. When setting, it doesn't really matter, we just always want to set via filename which matches this block.
    const path = sequenceFilePathFromId(this.id);

    //todo - how to handle asynchronous updates like this at model level... Optimistic updates? What about failures? Does this belong in the model? Or separate?
    writeFile(path, sequence)
      .then(response => {

      })
      .catch(error => {

      });

    return this.mutate('sequence', path);
  }

  annotate(annotation) {
    invariant(AnnotationDefinition.validate(annotation), `'annotation is not valid: ${annotation}`);
    return this.mutate('sequence.annotations', this.sequence.annotations.concat(annotation));
  }

  removeAnnotation(annotation) {
    const annotationId = typeof annotation === 'object' ? annotation.id : annotation;
    invariant(typeof annotationId === 'string', `Must pass object with ID or annotation ID directly, got ${annotation}`);

    const annotations = this.sequence.annotations.slice();
    const toSplice = annotations.findIndex((ann) => ann.id === annotationId);

    if (!Number.isInteger(toSplice)) {
      console.warn('annotation not found'); // eslint-disable-line
      return this;
    }

    annotations.splice(toSplice, 1);
    return this.mutate('sequence.annotations', annotations);
  }
}

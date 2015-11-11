import Instance from './Instance';

export default class Block extends Instance {
  constructor(forceId) {
    super(forceId);

    Object.assign(this, {
      components: [],
    });
  }

  addComponent(component) {
    const newBlock = this.clone();
    newBlock.components.push(component);
    return newBlock;
  }
}

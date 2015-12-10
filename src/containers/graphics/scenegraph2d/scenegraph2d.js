import uuid from 'node-uuid';
import Node2D from '../scenegraph2d/node2d';
import invariant from '../../../utils/environment/invariant';

export default class SceneGraph2D {

  constructor(props) {
    // extend this with defaults and supplied properties.
    // width / height are the actual dimensions of the scene graph.
    // availableWidth, availableHeight are the dimensions of the window we are in.
    Object.assign(this, {
      width: 800,
      height: 600,
      availableWidth: 800,
      availableHeight: 600,
      uuid: uuid.v4(),
    }, props);

    // we must have a parent before being created
    invariant(this.parent, 'expected a parent DOM element');

    // ensure our parent element has the scene graph class
    this.parent.classList.add('sceneGraph');

    // size our element to initial scene graph size
    this.updateSize();

    // create our root node, which represents the view matrix and to which
    // all other nodes in the graph are ultimately attached.
    this.root = new Node2D({sg: this});

    // root is appended directly to the scene graph BUT without setting a parent node.
    this.parent.appendChild(this.root.el);
  }

  /**
   * update our element to the current scene graph size
   * @return {[type]} [description]
   */
  updateSize() {
    this.parent.style.width = this.width + 'px';
    this.parent.style.height = this.height + 'px';
  }

  /**
   * generic in-order traversal of the nodes of the graph.
   * @param  {Function} callback
   * @param  {this}   context
   */
  traverse(callback, context) {
    let stack = [this.root];
    while (stack.length) {
      const next = stack.pop();
      callback.call(context, next);
      stack = stack.concat(next.children);
    }
  }

  /**
   * return the union of the AABB of all nodes in the scenegraph
   * except the root node
   * @return {Box2D}
   */
  getAABB() {
    let aabb = null;
    this.traverse( node => {
      // ignore the root, which we can identify because it has no parent
      if (node.parent) {
        const nodeAABB = node.getAABB();
        aabb = aabb ? aabb.union(nodeAABB) : nodeAABB;
      }
    });
    return aabb;
  }

  /**
   * updating the entire graph just involves updating the entire root node branch
   * @return {[type]} [description]
   */
  update() {
    this.root.updateBranch();
  }
}

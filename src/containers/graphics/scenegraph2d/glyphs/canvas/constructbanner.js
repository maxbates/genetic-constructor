/*
Copyright 2016 Autodesk,Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import Glyph2D from '../glyph2d';

export default class ConstructBanner extends Glyph2D {

  /**
   * construct banner is now just the triangle at top left of each construct viewer
   * @param node
   */
  constructor(node) {
    super(node);
    this.el = document.createElement('canvas');
    this.el.className = 'canvas-glyph';
    this.node.el.appendChild(this.el);
    this.ctx = this.el.getContext('2d');
  }

  /**
   * render into our bounds
   */
  update() {
    // update size
    this.el.width = this.node.width;
    this.el.height = this.node.height;

    // draw triangle
    this.ctx.fillStyle = this.node.fill;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(this.node.height, 0);
    this.ctx.lineTo(0, this.node.height);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

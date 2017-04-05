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
import Vector2D from '../geometry/vector2d';
import kT from '../views/layoutconstants';
import Node2D from './node2d';

/**
 * basic rectangular node
 */
export default class Backbone2D extends Node2D {

  constructor(props) {
    super(Object.assign({}, props, {
      glyph: 'backbone',
      textAlign: 'left',
      textIndent: kT.textPad + kT.roleIcon,
      color: '#1D222D',
      showChildren: true,
      endCap: false,
    }));
  }
  /**
   * mostly for debugging
   * @return {String}
   */
  toString() {
    return `SBOL = glyph:${this.glyph || 'NONE'} text:${this.text || ''}`;
  }

  /**
   * get the preferred width / height of this block as condensed or fully expanded
   *
   */
  getPreferredSize(str) {
    if (this.endCap) {
      return new Vector2D(kT.roleIcon + kT.textPad / 2, 0);
    }
    // measure actual text plus some padding
    const roleWidth = this.roleName ? kT.roleIcon + kT.textPad : 0;
    const size = this.measureText(str).add(new Vector2D(kT.textPad * 2 + roleWidth, 0));
    size.x = Math.max(kT.minBlockWidth, size.x);
    return size;
  }
}

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
import invariant from 'invariant';
import D from './dom';

import '../../../src/styles/sequence-editor.css';

/**
 * length of bases groups, plus 1 char inbetween
 * @type {Number}
 */
const groupLength = 10;

export default class SequenceEditor {

  constructor(props) {
    Object.assign(this, {

    }, props);
    invariant(this.parent, 'parent element must be supplied as an option');
    this.fabric();
  }

  dispose() {

  }

  /**
   * setup the basic elements of the DOM
   */
  fabric() {
    this.sequence = '';
    // setup DOM structure and append to parent
    this.dom = D(
      `<div data-ref="outer" class="sequence-editor sequence-editor-text">
        <div data-ref="gutter" class="gutter"></div>
        <div data-ref="bases" class="bases"></div>
      </div>`);
    this.dom.zip(this);
    this.parent.appendChild(this.dom.el);
  }

  // calculate metrics for fixed pitch font that we use
  measureChars() {
    // calculate text metrics
    const textDIV = D('<div class="sequence-editor-text sequence-editor-measure"></div>');
    this.bases.appendChild(textDIV.el);
    // use a representative long string hoping for the best average
    let probe = 'abcdefghijklmnopqrstuvwxyz01234567890-:+';
    probe += probe.toUpperCase();
    textDIV.innerHTML = probe;
    // measure the actual dimensions
    this.CW = textDIV.clientWidth / probe.length;
    this.CH = textDIV.clientHeight;
    // remove DIV once we have measured
    this.bases.removeChild(textDIV.el);
  }

  /**
   * calculate various metrics needed for layout and rendering
   * groupsRequired       : number of groups required to display entire sequence
   * groupWidth           : width of a single group in pixels, including a leading space char
   * groupsPerRow         : how many groups we can fit per row
   * rowsRequired         : number of rows required to display entire sequence.
   * visibleRows          : number of fully or partially visible rows
   *
   */
  metrics() {
    this.groupsRequired = Math.ceil(this.sequence.length / groupLength);
    this.groupWidth = this.CW * (groupLength + 1);
    const box = this.bases.getBoundingClientRect();
    this.groupsPerRow = Math.floor(box.width / this.groupWidth);
    this.rowWidth = this.groupWidth * this.groupsPerRow;
    this.rowsRequired = Math.ceil(this.groupsRequired / this.groupsPerRow);
    this.visibleRows = Math.ceil(box.height / this.CH);
  }

  /**
   * update is called whenever a new sequence is available for editing.
   */
  setSequence(s) {
    this.sequence = s;
    this.firstRow = 0;
    this.bases.empty();
    this.rowCache = [];
    this.measureChars();
    this.metrics();
    this.render();
  }

  /**
   * render the current state of the editor
   */
  render() {
    // render all visible rows, using the row cache if available
    for(let i = 0; i < this.visibleRows; i += 1) {
      // get actual index of this row
      const rowIndex = i + this.firstRow;
      // done if beyond the end of the rows
      if (rowIndex >= this.rowsRequired) {
        break;
      }
      this.renderRow(rowIndex);
    }
  }

  /**
   * create the row element as necessary or pull from the cache.
   * position according to the first visible row
   */
  renderRow(rowIndex) {
    let row = this.rowCache[rowIndex];
    if (!row) {
      row = this.rowCache[rowIndex] = D('<div class="bases-row"></div>');
      row.setStyles({
        width: this.rowWidth + 'px',
        height: this.CH + 'px',
      });
      this.bases.appendChild(row.el);
      // construct the text for the row
      let str = '';
      let startIndex = rowIndex * (this.groupsPerRow * groupLength);
      for(let i = 0; i < this.groupsPerRow; i += 1) {
        str += ' ' + this.sequence.substr(startIndex + i * groupLength, groupLength);
      }
      row.innerHTML = str;
    }
    row.setStyles({
      top: (rowIndex - this.firstRow) * this.CH + 'px',
    });
  }
}
/*
  1           ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  41          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  81          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
 */

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
import Vector2D from '../../containers/graphics/geometry/vector2d';
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
        <div data-ref="bases" class="bases" tabindex="0"></div>
      </div>`);
    this.dom.zip(this);
    this.parent.appendChild(this.dom.el);
    this.userInterfaceFabric();
  }

  /**
   * setup the user interface
   */
  userInterfaceFabric() {
    // keyboard interface
    this.keyboardSetup();
  }

  /**
 * setup and handler all keyboard interactions
 * NOTE: Currently we don't have the notion of a permanent caret like a text editor
 * so certain operations are impossible ( because they need a caret to anchor them ) e.g. shift reduce
 * the right edge of selection and continue selecting to the left of the caret when the selection
 * becomes collapsed
 */
keyboardSetup() {

  // handle key presses according to state
  this.bases.on('keydown', event => {

    const keyboardMap = {
      'Home'            : event => {
        this.firstRow = 0;
      },
      'End'             : event => {

      },
      'ArrowUp'         : event => {

      },
      'ArrowUp+Shift'   : event => {

      },
      'ArrowDown'       : event => {

      },
      'ArrowDown+Shift' : event => {

      },
      'ArrowRight'      : event => {
        // move caret to the right and make visible
        // const next = this.selection.nextCaret(this.selection.caretRowEnd);
        // this.setSelection(next, next);
        // this.viewer.ensureRowVisible(next.y);
        console.log('Arrow Right');
      },
      'ArrowLeft'       : event => {
        // move caret to the right and make visible
        // const prev = this.selection.previousCaret(this.selection.caretRowEnd);
        // this.setSelection(prev, prev);
        // this.viewer.ensureRowVisible(prev.y);
        console.log('Arrow Left');
      },
      // increase selection to the right
      'ArrowRight+Shift': (event) => {

      },
      // decrease selection at right end
      'ArrowLeft+Shift' : (event) => {

      },
    };

    // call the handler if there is one ( add modifiers to name used to select action )
    let code = event.key;
    if (event.shiftKey) {
      code += '+Shift';
    }
    if (event.metaKey) {
      code += '+Meta';
    }
    if (event.ctrlKey) {
      code += '+Ctrl';
    }
    if (event.altKey) {
      code += '+Alt';
    }

    if (keyboardMap[code]) {
      keyboardMap[code].call(this, event);
      // // hide mouse cursor, most of these actions will move the display
      // this.hideCursor();
      // // redraw
      // this.viewer.render();
    }
  });
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
   * basesPerRow          : actual bases per row not including spacers
   * rowsRequired         : number of rows required to display entire sequence.
   * visibleRows          : number of fully or partially visible rows
   *
   */
  metrics() {
    this.groupsRequired = Math.ceil(this.sequence.length / groupLength);
    this.groupWidth = this.CW * (groupLength + 1);
    const box = this.bases.getBoundingClientRect();
    this.groupsPerRow = Math.floor(box.width / this.groupWidth);
    this.basesPerRow = this.groupsPerRow * groupLength;
    this.rowWidth = box.width;
    this.rowsRequired = Math.ceil(this.groupsRequired / this.groupsPerRow);
    this.visibleRows = Math.ceil(box.height / this.CH);
  }

  /**
   * update is called whenever a new sequence is available for editing.
   */
  setSequence(s) {
    this.sequence = s;
    this.firstRow = 0;
    this.selection = new Selection(this);
    D('.bases-row', this.bases).remove();
    this.rowCache = [];
    this.gutterCache = [];
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
      this.renderGutter(rowIndex);
    }
    this.renderSelection();
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
  /**
   * render the gutter for a given row
   */
  renderGutter(rowIndex) {
    let row = this.gutterCache[rowIndex];
    if (!row) {
      row = this.gutterCache[rowIndex] = D('<div class="gutter-row"></div>');
      row.setStyles({
        height: this.CH + 'px',
      });
      this.gutter.appendChild(row.el);
      row.innerHTML = (rowIndex * groupLength * this.groupsPerRow + 1).toString();
    }
    row.setStyles({
      top: (rowIndex - this.firstRow) * this.CH + 'px',
    });
  }
  /**
   * render the selection or caret its current position.
   */
  renderSelection() {
    if (this.selection.isCollapsed) {
      if (!this.caretElement) {
        this.caretElement = D('<div class="caret"></div>');
        this.bases.appendChild(this.caretElement.el);
      }
      const position = this.caretToXY(this.selection.caretStart);
      this.caretElement.setStyles({
        left: position.x + 'px',
        top: position.y + 'px',
        height: this.CH + 'px',
      });
    } else {
      // hide the caret
      if (this.caretElement) {
        this.caretElement.remove();
        this.caretElement = null;
      }
    }
  }

  /**
   * get the XY position of the given caret position, relative to the bases element
   * @return {Vector2D}
   */
  caretToXY(caret) {
    return new Vector2D(caret.caret * this.CW, (caret.row - this.firstRow) * this.CH);
  }
}

/**
 * represents the selection/caret
 */
class Selection {

  constructor(editor, caretStart = null, caretEnd = null) {
    this.editor = editor;
    this.set(caretStart, caretEnd);
  }

  /**
   * set start/end of selection. If not specified defaults to a collapsed caret at 0,0
   */
  set(caretStart, caretEnd) {
    this.caretStart = caretStart || {row: 0, caret: 0};
    this.caretEnd = caretEnd || {row: 0, caret: 0};
  }

  /**
   * return if we have no range, only a position i.e. a caret
   */
  get isCollapsed() {
    return this.caretStart.row === this.caretEnd.row && this.caretStart.caret === this.caretEnd.caret;
  }

  /**
   * render the selection into the given layer of the viewer
   * @param viewer
   */
  render() {

  }
}
/*
  1           ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  41          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  81          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
 */

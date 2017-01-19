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
import React, { Component, PropTypes } from 'react';
import { getPalette } from '../../utils/color/index';
import '../../styles/ColorPicker.css';

//todo - this has a lot of logic shared with Symbol Picker, but some differences in data structure etc. Should probably merge them though.

export default class ColorPicker extends Component {
  static propTypes = {
    paletteName: PropTypes.string,
    current: PropTypes.number,
    readOnly: PropTypes.bool.isRequired,
    onSelectColor: PropTypes.func.isRequired,
  };

  state = {
    expanded: false,
  };

  /**
   * track mouse down while the picker is expanded
   * @param event
   */
  mouseDown = (event) => {
    let current = event.target;
    while (current) {
      if (current.classList && Array.from(current.classList).indexOf('single-color-picker') >= 0) {
        // the click was in some part of the color picker so ignore
        return;
      }
      current = current.parentNode;
    }
    // if here the click was outside the picker so close
    document.body.removeEventListener('mousedown', this.mouseDown);
    this.setState({ expanded: false });
  };

  /**
   * toggle between open / closed
   */
  toggle = () => {
    if (!this.props.readOnly) {
      // if about to expand we need to track mouse clicks outside to close
      if (!this.state.expanded) {
        document.body.addEventListener('mousedown', this.mouseDown);
      } else {
        document.body.removeEventListener('mousedown', this.mouseDown);
      }
      // toggle state
      this.setState({ expanded: !this.state.expanded });
    }
  };


  render() {
    const currentPalette = getPalette(this.props.paletteName);
    let color;
    if (Number.isFinite(this.props.current)) {
      color = currentPalette[this.props.current];
    } else {
      color = { hex: 'lightgray', name: 'No Color' };
    }
    let chips;
    if (this.state.expanded) {
      chips = (
        <div className="dropdown">
          {currentPalette.map((color, index) => {
            return (
              <div className="color-wrapper" key={index}>
                <div
                  onClick={() => this.props.onSelectColor(index)}
                  className="color"
                  style={{
                    backgroundColor: color.hex,
                    borderColor: index === this.props.current ? 'white' : 'transparent',
                  }}
                />
              </div>
            );
          })}
          <div className="arrow" />
        </div>
      );
    }
    return (
      <div className="single-color-picker" onClick={this.toggle}>
        <div className="label">Color</div>
        <div className="color" style={{ backgroundColor: color.hex }}>
          {chips}
        </div>
      </div>
    );
  }
}

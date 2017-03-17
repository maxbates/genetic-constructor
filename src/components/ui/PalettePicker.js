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

import { getPalette, palettes } from '../../utils/color/index';

import '../../styles/PalettePicker.css';

//todo - this has a lot of logic shared with Symbol Picker, but some differences in data structure etc. Should probably merge them though.

export default class PalettePicker extends Component {
  static propTypes = {
    onSelectPalette: PropTypes.func.isRequired,
    paletteName: PropTypes.string,
    readOnly: PropTypes.bool,
  };

  /**
   * user selected a different palette
   * @param paletteName
   */
  onSelectPalette = (paletteName) => {
    if (!this.props.readOnly) {
      this.props.onSelectPalette(paletteName);
    }
  };

  render() {
    // the palette to display
    const currentPalette = getPalette(this.props.paletteName).slice();
    // number of colors per row
    const rowSizes = [4, 3, 5];
    const rows = [];
    while (currentPalette.length) {
      const rowSize = rowSizes.shift();
      rowSizes.push(rowSize);
      const colors = currentPalette.splice(0, rowSize);
      rows.push((
        <div className="row" key={colors[0].hex}>
          {colors.map(color => <div className="color" style={{ backgroundColor: color.hex }} key={color.hex} />)}
        </div>
      ));
    }

    return (
      <div className="color-tabs">
        <div className="ribbon">
          {palettes.map((paletteName) => {
            let classes = 'tab';
            if (paletteName === this.props.paletteName) {
              classes += ' active';
            }
            if (this.props.readOnly) {
              classes += ' readOnly';
            }
            return (<div
              className={classes}
              key={paletteName}
              onClick={() => this.onSelectPalette(paletteName)}
            >{paletteName}
            </div>);
          })}
        </div>
        <div className="palette-picker-content">
          <div className="color-container">
            {rows}
          </div>
        </div>
      </div>
    );
  }
}

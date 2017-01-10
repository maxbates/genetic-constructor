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

import symbols, { symbolMap } from '../../inventory/roles';
import '../../styles/SBOLPicker.css';
import RoleSvg from '../RoleSvg';

export default class SBOLPicker extends Component {
  static propTypes = {
    readOnly: PropTypes.bool,
    current: PropTypes.any,
    onSelect: PropTypes.func,
  };

  static makeHoverText(symbolId) {
    return symbolMap[symbolId] || symbolId || 'No Symbol';
  }

  constructor(props) {
    super(props);
    this.state = {
      hoverText: SBOLPicker.makeHoverText(props.current),
    };
  }

  /**
   * user clicked on of the symbols identified by the bound id
   */
  onClick = (id) => {
    const { readOnly, onSelect } = this.props;
    const next = id === 'null' ? null : id;
    if (!readOnly) {
      onSelect(next);
    }
  };

  onMouseEnter = (id) => {
    this.setState({ hoverText: SBOLPicker.makeHoverText(id) });
  };

  onMouseLeave = () => {
    this.setState({ hoverText: SBOLPicker.makeHoverText(this.props.current) });
  };

  render() {
    const { current } = this.props;
    return (
      <div className="SBOLPicker">
        <div className="SBOLPicker-content">
          <div className="name">{this.state.hoverText}</div>
          <div className="sbol-picker">
            {symbols.map((symbolObj) => {
              const { id } = symbolObj;
              return (<RoleSvg
                width="54px"
                height="54px"
                color={current === id ? 'white' : 'black'}
                classes={current === id ? 'active' : null}
                symbolName={id}
                onClick={() => this.onClick(id)}
                onMouseEnter={() => this.onMouseEnter(id)}
                onMouseLeave={this.onMouseLeave}
                key={id}
              />);
            })}
          </div>
        </div>
      </div>
    );
  }
}

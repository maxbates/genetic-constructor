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

import { symbols, symbolMap } from '../../inventory/roles';
import '../../styles/SBOLPicker.css';
import RoleSvg from './RoleSvg';

export default class SBOLPicker extends Component {
  static propTypes = {
    readOnly: PropTypes.bool,
    current: PropTypes.any,
    onSelect: PropTypes.func,
    setText: PropTypes.func,
  };

  static makeHoverText(symbolId) {
    return `Symbol: ${symbolMap[symbolId] || symbolId || 'No Symbol'}`;
  }

  constructor(props) {
    super(props);
    this.state = {
      hoverText: SBOLPicker.makeHoverText(props.current),
    };
  }

  state = {
    expanded: false,
  };

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

  /**
   * track mouse down while the picker is expanded
   * @param event
   */
  mouseDown = (event) => {
    let current = event.target;
    while (current) {
      if (current.classList && Array.from(current.classList).indexOf('SBOLPicker') >= 0) {
        // the click was in some part of the color picker so ignore
        return;
      }
      current = current.parentNode;
    }
    // if here the click was outside the picker so close
    document.body.removeEventListener('mousedown', this.mouseDown);
    this.setState({
      expanded: false,
    });
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
        this.props.setText('');
      }
      // toggle state
      this.setState({
        expanded: !this.state.expanded,
      });
    }
  };

  makeSymbolCurrent = id =>
    (
      <div className="wrapper">
        <RoleSvg
          width="54px"
          height="54px"
          color={'black'}
          symbolName={id}
          key={id}
          large={true}//eslint-disable-line react/jsx-boolean-value
        />
      </div>
    );

  makeSymbol = id =>
    (
      <div
        key={id}
        className="highlight"
        onMouseEnter={() => this.props.setText(SBOLPicker.makeHoverText(id))}
        onMouseLeave={() => this.props.setText('')}
        onClick={() => this.onClick(id)}
      >
        <div className="wrapper">
          <RoleSvg
            width="54px"
            height="54px"
            color={'black'}
            symbolName={id}
            large={true}//eslint-disable-line react/jsx-boolean-value
          />
        </div>
      </div>
    );


  render() {
    const { current } = this.props;
    let chips;
    if (this.state.expanded) {
      chips = (
        <div className="dropdown">
          {symbols.filter(symbolObj => symbolObj.id !== 'list' && symbolObj.id !== 'backbone').map((symbolObj) => {
            const { id } = symbolObj;
            return this.makeSymbol(id);
          })}
          <div className="arrow" />
        </div>
      );
    }

    return (
      <div
        className="SBOLPicker"
        onClick={this.toggle}
      >
        {this.makeSymbolCurrent(current)}
        {chips}
      </div>);
  }
}

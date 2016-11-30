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
import SubMenu from './SubMenu';
import Arrow from '../ui/Arrow';
import { stringToShortcut } from '../../utils/ui/keyboard-translator';
import Box2D from '../../containers/graphics/geometry/box2d';

import '../../styles/MenuItem.css';

/**
 * Popup window class. Accepts any component as it client.
 * Required properties:
 *
 * {String} title - title bar text for window
 * {Function} onClose - function to call when the window is closed
 * {ReactElement} client - element to place in the client area
 */
export default class MenuItem extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    action: PropTypes.func,
    disabled: PropTypes.bool,
    checked: PropTypes.bool,
    shortcut: PropTypes.string,
    classes: PropTypes.string,
    close: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      inside: false,
    }
  }

  /**
   * click handler
   * @param evt
   */
  onClick = (evt) => {
    evt.stopPropagation();
    if (!this.props.disabled) {
      this.props.action(evt);
    }
  };


  /**
   * delicate switch around opening and closing
   */
  onMouseEnter = () => {
    this.setState({inside: true});
  };

  onMouseLeave = () => {
    this.setState({inside: false});
  };


  render() {
    // indent if check able regardless of checked state
    const indent = this.props.checked === true || this.props.checked === false;
    let check = null;
    if (indent) {
      check = <div className={this.props.checked ? 'menu-item-checked' : 'menu-item-unchecked'}></div>;
    }
    // short cut if any
    const shortcut = this.props.shortcut && (
        <div
          className="menu-item-shortcut"
          disabled={this.props.disabled}>{stringToShortcut(this.props.shortcut)}
        </div>);
    // text
    const text = (<div className="text">{this.props.text}</div>);
    // arrow
    let subMenu;
    if (this.props.menuItems && this.props.menuItems.length) {
      subMenu = (
        <div className="arrow">
          <Arrow direction="right" disabled={false}/>
          {this.state.inside &&
          <SubMenu
            menuItems={this.props.menuItems}
            close={this.props.close}
            className={`menu-overlay-menu sub-menu sub-menu-${this.props.openLeft ? 'left' : 'right'}`}
            openLeft={this.props.openLeft}
          />}
        </div>
      );
    }

    let classes = 'menu-item' + (this.props.disabled ? ' disabled' : '');
    if (this.props.classes) {
      classes += ` ${this.props.classes}`;
    }

    return (
      <div
        className={classes}
        onClick={this.onClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        ref="itemElement"
      >
        <div className="left">
          {check}
          {text}
        </div>
        <div className="right">
          {shortcut}
          {subMenu}
        </div>
      </div>
    );
  }
}

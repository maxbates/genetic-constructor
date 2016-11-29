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
import Box2D from '../../containers/graphics/geometry/box2d';
import Vector2D from '../../containers/graphics/geometry/vector2d';
import { stringToShortcut } from '../../utils/ui/keyboard-translator';
import SubMenu from './SubMenu';

import '../../../src/styles/MenuOverlay.css';
/**
 * Elements that holds the active menu and blocks access to the page behind it.
 */
export default class MenuOverlay extends Component {
  static propTypes = {};

  constructor() {
    super();
    this.state = {
      target: '.cvc-drop-target',
      checked: true,
    };
    this.menuItems = [
      {
        text: 'Save Project',
        shortcut: stringToShortcut('meta S'),
        action: () => {
          alert("Save");
        },
      },
      {
        text: 'Delete Project',
        action: () => {
          alert("Delete");
        },
      },
      {
        text: 'Open Project',
        shortcut: stringToShortcut('option shift ctrl O'),
        menuItems: [
          {
            text: 'this is a very long piece of text for a menu',
            shortcut: stringToShortcut('meta option S'),
            action: () => {
              alert("Save Nested");
            },
          },
          {
            text: 'DP Nested',
            action: () => {
              alert("Delete Nested");
            },
            menuItems: [
              {
                text: 'Save P Nested Twice',
                action: () => {
                  alert("Save Nested Nested");
                },
              },
              {
                text: 'Nested Nested',
                action: () => {
                  alert("Delete Nested Nested");
                },
              },
            ],
          },
        ],
        action: () => {
          alert("Open");
        },
      },
      {},
      {
        text: 'Kill Project',
        shortcut: stringToShortcut('shift meta K'),
        action: () => {
          alert("Kill");
        },
      },
      {},
      {
        text: 'Disabled Item',
        disabled: true,
      },
      {
        text: 'Another Checked Item',
        checked: this.state.checked,
        shortcut: stringToShortcut('shift option c'),
        action: () => {
          const newState = !this.state.checked;
          this.menuItems.forEach(item => {
            if (item.hasOwnProperty('checked')) {
              item.checked = newState;
            }
          });
          this.setState({checked: newState});
        },
      },
      {
        text: 'Checked Item',
        checked: this.state.checked,
        action: () => {
          const newState = !this.state.checked;
          this.menuItems.forEach(item => {
            if (item.hasOwnProperty('checked')) {
              item.checked = newState;
            }
          });
          this.setState({checked: newState});
        },
      },
    ];
  }

  /**
   * get the position for the menu based on the css target
   */
  getPosition() {
    const element = document.querySelector(this.state.target);
    if (element) {
      const bounds = new Box2D(element.getBoundingClientRect());
      return new Vector2D(bounds.x + 100, bounds.bottom);
    }
    return new Vector2D(100, 200);
  }

  /**
   * get the side class based on our target selector
   */
  getSideClass() {
    const element = document.querySelector(this.state.target);
    if (element) {
      const bounds = new Box2D(element.getBoundingClientRect());
      return bounds.x + 100 < document.body.clientWidth / 2 ? 'menu-overlay-menu menu-overlay-left' : 'menu-overlay-menu menu-overlay-right';
    }
    return 'menu-overlay-menu menu-overlay-top menu-overlay-left';
  }

  /**
   * handle window resizes
   */
  componentDidMount() {
    window.addEventListener('resize', this.windowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.windowResize);
  }

  windowResize = () => {
    this.forceUpdate();
  };


  /**
   * open or close based on current state
   */
  close = () => {

  };

  /*
   * render modal dialog with owner supplied payload and optional buttons.
   */
  render() {

    // get position for the menu based on the target element
    const pos = this.getPosition();
    // size and position pointer and menu
    const psize = 20;
    const pointerPosition = {
      width: psize + 'px',
      height: psize + 'px',
      left: pos.x + 'px',
      top: pos.y + 'px',
    };
    const menuPosition = {
      left: pos.x + 'px',
      top: pos.y + psize / 2 + 'px',
    };
    return (
      <div className="menu-overlay">
        <div className="menu-overlay-pointer" style={pointerPosition}></div>
        <SubMenu
          menuItems={this.menuItems}
          position={menuPosition}
          close={this.close}
          className={this.getSideClass()}
        />
      </div>
    );
  }
}
/*
<div className={this.getSideClass()} style={menuPosition}>
  {this.menuItems.map((item, index) => {
    const boundAction = () => {
      item.action();
      this.close();
    };
    return (
      item.text ?
        (<MenuItem
          key={item.text}
          text={item.text}
          shortcut={item.shortcut}
          checked={item.checked}
          disabled={!!item.disabled}
          classes={item.classes}
          menuItems={item.menuItems}
          close={this.close}
          action={boundAction}/>) :
        (<MenuSeparator key={index}/>)
    );
  })}
</div>
*/
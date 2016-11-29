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
 limitations under the License..
 */
import React, { Component, PropTypes } from 'react';
import MenuItem from './MenuItem';
import MenuSeparator from './MenuSeparator';

export default class SubMenu extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    menuItems: PropTypes.array.isRequired,
    position: PropTypes.object,
  };

  render() {
    return (
      <div className={this.props.className} style={this.props.position}>
        { this.props.menuItems.map((item, index) => {
          const boundAction = () => {
            if (item.menuItems) {
              alert('Open Sub Menu');
            } else {
              if (!item.disabled) {
                item.action();
                this.props.close();
              }
            }
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
                action={boundAction}
                menuItems={item.menuItems}
              />) :
              (<MenuSeparator key={index}/>)
          )
        })
        }
      </div>)
  }
}
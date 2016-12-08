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
import Arrow from './Arrow';
import Label from './Label';
import Expando from './Expando';

import '../../styles/Tree.css';


export default class Tree extends Component {
  static propTypes = {

  };

  static defaultProps = {
    depth: 0,
  };

  constructor() {
    super();
    this.state = {

    };
  }

  /**
   * when a branch is expanded
   * @param item
   */
  onExpandBranch(item) {
    if (item.onExpand) {
      item.onExpand(item);
    }
  }

  render() {
    return (
      <div className="tree">
        {(this.props.items || []).map((item, index) => {
          return (
            <div style={{paddingLeft: this.props.depth ? '12px' : '0'}}>
              <Expando
                showArrowWhenEmpty={this.props.depth === 0}
                onExpand={this.onExpandBranch.bind(this, item)}
                key={index}
                text={item.text}
                textWidgets={item.textWidgets}
                bold={item.bold}
                labelWidgets={item.labelWidgets}
                onContextMenu={item.onContextMenu}
                startDrag={item.startDrag}
                selected={item.selected}
                content={item.items && item.items.length
                  ? <Tree
                  items={item.items}
                  depth={this.props.depth + 1}
                  />
                  : null}
              />
            </div>);
        })}
      </div>
    );
  }
}

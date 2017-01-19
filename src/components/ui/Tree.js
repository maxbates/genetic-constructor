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

import '../../styles/Tree.css';
import Expando from './Expando';
import { getLocal } from '../../utils/localstorage';

export default class Tree extends Component {
  static propTypes = {
    items: PropTypes.array,
    depth: PropTypes.number.isRequired,
  };

  static defaultProps = {
    items: [],
    depth: 0,
  };

  /**
   * when a branch is clicked
   * @param item
   */
  static onClickBlock(item) {
    if (item.onClick) {
      item.onClick(item);
    }
  }

  /**
   * when a branch is expanded
   * @param item
   */
  onExpandBranch = (item) => {
    if (item.onExpand) {
      item.onExpand(item);
    }
  };

  render() {
    /* add to expando to make state persistent but project must be loaded for this to work

     stateKey={item.stateKey}
     openByDefault={getLocal(item.stateKey, false, true)}

     */
    return (
      <div className="tree">
        {(this.props.items || []).map((item, index) => (
          <div
            key={index}
            style={{
              paddingLeft: this.props.depth === 0 ? '0' : '12px',
            }}
          >
            <Expando
              showArrowWhenEmpty={this.props.depth === 0}
              onExpand={() => this.onExpandBranch(item)}
              onClick={() => Tree.onClickBlock(item)}
              key={index}
              text={item.text}
              testid={item.testid}
              textWidgets={item.textWidgets}
              bold={item.bold}
              labelWidgets={item.labelWidgets}
              onContextMenu={item.onContextMenu}
              startDrag={item.startDrag}
              selected={item.selected}
              showLock={item.locked}
              content={item.items && item.items.length
                ? <Tree
                  items={item.items}
                  depth={this.props.depth + 1}
                />
                : null}
            />
          </div>))}
      </div>
    );
  }
}

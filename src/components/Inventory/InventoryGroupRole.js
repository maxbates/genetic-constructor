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
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { uiSetGrunt, uiSpin } from '../../actions/ui';
import { role as roleDragType } from '../../constants/DragTypes';
import DnD from '../../containers/graphics/dnd/dnd';
import MouseTrap from '../../containers/graphics/mousetrap';
import inventoryRoles from '../../inventory/roles';
import Block from '../../models/Block';
import '../../styles/InventoryGroupRole.css';
import RoleSvg from '../RoleSvg';

class InventoryGroupRole extends Component {
  static propTypes = {
    uiSetGrunt: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
  };

  /**
   * dictates the sort order of sbol tiles
   * //todo - should be in roles.js so shared with role picker
   */
  static sortOrder = [
    'promoter',
    'cds',
    'rbs',
    'terminator',
    'protease',
    'ribonuclease',
    'rna stability',
    'protein stability',
    'origin of replication',
    'operator',
    'insulator',
    'restriction site',
    'structural',
    'bidrectional promoter',
    'plasmin backbone',
    'combinatorial list',
    'no symbol',
  ];

  constructor(props) {
    super(props);
    this.roleSymbols = inventoryRoles;
  }

  state = {
    current: { id: null, name: null },
  };

  componentDidMount() {
    this.mouseTrap = new MouseTrap({
      element: ReactDOM.findDOMNode(this),
      mouseDrag: this.mouseDrag.bind(this),
    });
  }

  onMouseEnter = (item) => {
    this.setState({ current: item });
  };

  onMouseLeave = () => {
    this.setState({ current: { id: null, name: null } });
  };

  mouseDrag(event, localPosition, startPosition, distance) {
    // cancel mouse drag and start a drag and drop
    this.mouseTrap.cancelDrag();
    // ignore if no block selected
    if (!this.state.current.id) {
      return;
    }
    // get global point as starting point for drag
    const globalPoint = this.mouseTrap.mouseToGlobal(event);

    // make a block to drag
    const roleBlock = new Block({
      id: this.state.current,
      metadata: {
        name: this.state.current.name,
        color: null,
      },
      rules: {
        role: this.state.current.id === 'null' ? null : this.state.current.id,
      },
    });
    // start DND
    DnD.startDrag(this.makeDnDProxy(), globalPoint, {
      item: roleBlock,
      type: roleDragType,
      source: 'inventory',
    }, {
      onDropFailure: (error, target) => {
        this.props.uiSetGrunt(`There was an error creating a block for ${this.state.current.metadata.name}`);
        this.props.uiSpin();
      },
    });
  }

  /**
   * make a drag and drop proxy for the item
   */
  makeDnDProxy() {
    const item = this.state.current;
    const proxy = document.createElement('div');
    proxy.className = 'InventoryRoleGroup-DNDProxy';
    proxy.innerHTML = item.name;
    const element = ReactDOM.findDOMNode(this.refs[item.id]);
    const svg = element.querySelector('svg');
    if (svg) {
      const svgClone = svg.cloneNode(true);
      svgClone.removeAttribute('data-reactid');
      proxy.appendChild(svgClone);
    }
    return proxy;
  }

  render() {
    const current = this.state.current;

    // sort items by order given by sortOrder
    const sorted = this.roleSymbols.slice();
    sorted.sort((itemA, itemB) => InventoryGroupRole.sortOrder.indexOf(itemA.name.toLowerCase()) -
    InventoryGroupRole.sortOrder.indexOf(itemB.name.toLowerCase()));

    return (
      <div className="InventoryGroup-content InventoryGroupRole">
        <div className="InventoryGroup-contentInner">
          <p>
            Drag a sketch block to the canvas to add it to your project. Hold down the option ( alt ) key
            to reverse the direction of the block.
          </p>
          <div className="list">
            {sorted.map(item => (
              <div className="sbol-tile" key={item.id}>
                <RoleSvg
                  width="54px"
                  height="54px"
                  large={true}
                  color={current.id === item.id ? 'white' : 'black'}
                  classes={current.id === item.id ? 'active' : null}
                  symbolName={item.id}
                  onMouseEnter={() => this.onMouseEnter(item)}
                  onMouseLeave={this.onMouseLeave}
                  ref={item.id}
                />
                <div className={`name${current.id === item.id ? ' active' : ''}`}>{item.name}</div>
              </div>))}
          </div>
        </div>
      </div>);
  }
}

export default connect(null, {
  uiSetGrunt,
  uiSpin,
})(InventoryGroupRole);

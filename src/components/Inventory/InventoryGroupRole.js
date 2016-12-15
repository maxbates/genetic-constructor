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
import React, { Component } from 'react';
import inventoryRoles from '../../inventory/roles';
import InventorySearch from './InventorySearch';
import InventoryItemRole from './InventoryItemRole';
import RoleSvg from '../RoleSvg';

import '../../styles/InventoryGroupRole.css';

export default class InventoryGroupRole extends Component {
  constructor(props) {
    super(props);
    this.roleSymbols = inventoryRoles;
  }

  state = {
    filter: InventoryGroupRole.filter || '',
    current: null,
  };

  static filter = '';

  handleFilterChange = (filter) => {
    InventoryGroupRole.filter = filter;
    this.setState({filter});
  };

  onMouseEnter = (id) => {
    this.setState({current: id});
  };

  onMouseLeave = () => {
    this.setState({current: null});
  };

  render() {
    const current = this.state.current;
    const filtered = this.roleSymbols.filter(item => {
      return item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0;
    });

    return (
      <div className="InventoryGroup-content InventoryGroupRole">
        <InventorySearch searchTerm={this.state.filter}
                         disabled={false}
                         placeholder="Filter sketch blocks"
                         onSearchChange={this.handleFilterChange}/>
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          <div className="list">
          {filtered.map(item => {
              return (
                <div className="sbol-tile">
                  <RoleSvg strokeWidth={1}
                           width="50px"
                           height="50px"
                           color={current === item.id ? "white" : "black"}
                           classes={current === item.id ? "active" : null}
                           symbolName={item.id}
                           onMouseEnter={this.onMouseEnter.bind(this, item.id)}
                           onMouseLeave={this.onMouseLeave}
                           key={item.id}/>
                  <div className={`name${current === item.id ? ' active' : ''}`}>{item.name}</div>
                </div>);
            })}
          </div>
        </div>
      </div>);
  }
}

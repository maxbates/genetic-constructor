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

export default class InventoryGroupRole extends Component {
  constructor(props) {
    super(props);
    this.roleSymbols = inventoryRoles;
  }

  state = {
    filter: InventoryGroupRole.filter || '',
    inside: false,
  };

  static filter = '';

  handleFilterChange = (filter) => {
    InventoryGroupRole.filter = filter;
    this.setState({filter});
  };

  render() {
    return (
      <div className="InventoryGroup-content InventoryGroupRole">
        <InventorySearch searchTerm={this.state.filter}
                         disabled={false}
                         placeholder="Filter sketch blocks"
                         onSearchChange={this.handleFilterChange}/>
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {this.roleSymbols.filter(item => {
              return item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0;
            }).map(item => (
              <InventoryItemRole key={item.id}
                                 role={item}
              />
            ))
          }
        </div>
      </div>
    );
  }
}

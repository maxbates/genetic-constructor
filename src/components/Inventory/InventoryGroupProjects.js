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

import InventoryProjectTree from './InventoryProjectTree';
import InventoryRoleMap from './InventoryRoleMap';
import InventoryTabs from './InventoryTabs';
import InventorySearch from './InventorySearch';

export default class InventoryGroupProjects extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string,
    templates: PropTypes.bool.isRequired,
  };

  constructor() {
    super();

    this.inventoryTabs = [
      { key: 'project', name: 'By Project' },
      { key: 'type', name: 'By Kind' },
    ];
  }

  state = {
    groupBy: 'project',
    filter: '',
  };

  onTabSelect = (key) => {
    this.setState({ groupBy: key });
  };

  /**
   * project filter changed
   * @param filter
   */
  handleFilterChange = (filter) => {
    this.setState({ filter });
  };

  render() {
    const { currentProjectId } = this.props;
    const { groupBy } = this.state;
    const currentList = groupBy === 'type'
      ?
        <InventoryRoleMap />
      :
        (<InventoryProjectTree
          filter={this.state.filter}
          currentProjectId={currentProjectId}
          templates={this.props.templates}
        />);

    return (
      <div className="InventoryGroup-content InventoryGroupProjects">
        <InventoryTabs
          tabs={this.inventoryTabs}
          activeTabKey={groupBy}
          onTabSelect={tab => this.onTabSelect(tab.key)}
        />
        {groupBy !== 'type'
          ?
            <InventorySearch
              searchTerm={this.state.filter}
              disabled={false}
              placeholder="Search"
              onSearchChange={this.handleFilterChange}
            />
          :
            null
        }
        <div className="InventoryGroup-contentInner">
          {currentList}
        </div>
      </div>
    );
  }
}

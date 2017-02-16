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
import { connect } from 'react-redux';

import { snapshotCommonsList } from '../../actions/snapshots';
import InventoryProjectTree from './InventoryProjectTree';
import InventoryTabs from './InventoryTabs';

import { SHARING_IN_PUBLIC_INVENTORY } from '../../constants/links';

export class InventoryGroupCommons extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    snapshots: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.inventoryTabs = [
      { key: 'author', name: 'By Author' },
      { key: 'keyword', name: 'By Keyword' },
    ];
  }

  componentDidMount() {
    //get all the snapshots
  }

  state = {
    groupBy: 'author',
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
    const { snapshots, currentProjectId } = this.props;
    const { filter, groupBy } = this.state;

    //todo - fetch all the published projects ---- where should they be stored?
    //todo
    const currentList = groupBy === 'author' ? null : null;

    return (
      <div className="InventoryGroup-content InventoryGroupCommons">
        <InventoryTabs
          tabs={this.inventoryTabs}
          activeTabKey={groupBy}
          onTabSelect={tab => this.onTabSelect(tab.key)}
        />
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {currentList}
        </div>
      </div>
    );
  }
}

export default connect((state, props) => ({ snapshots: state.snapshots }), {

})(InventoryGroupCommons);

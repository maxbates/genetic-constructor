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
import _ from 'lodash';

import { commonsQuery, commonsRetrieve } from '../../actions/commons';
import InventoryProjectTree from './InventoryProjectTree';
import InventoryTabs from './InventoryTabs';

import { SHARING_IN_PUBLIC_INVENTORY } from '../../constants/links';

export class InventoryGroupCommons extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    commons: PropTypes.shape({
      projects: PropTypes.object.isRequired,
    }).isRequired,
    commonsQuery: PropTypes.func.isRequired,
    commonsRetrieve: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.inventoryTabs = [
      { key: 'author', name: 'By Author' },
      { key: 'keyword', name: 'By Keyword' },
    ];
  }

  state = {
    snapshots: [],
    groupBy: 'author',
    filter: '',
  };

  componentDidMount() {
    //initial query, just get everything for now
    this.props.commonsQuery();
  }

  componentWillReceiveProps(nextProps, nextState) {
    if (this.props.commons !== nextProps.commons) {

      //todo - update this
      this.setState({
        snapshots: _(nextProps.snapshots)
        .groupBy('projectId')
        .mapValues((projectSnapshots, projectId) => _.maxBy(projectSnapshots, 'version'))
        .values()
        .value(),
      });
    }
  }

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
    const { snapshots, filter, groupBy } = this.state;

    console.log(snapshots);

    //todo - fetch all the published projects ---- where should they be stored?
    //todo
    const grouped = groupBy === 'author' ? null : null;

    const currentList = snapshots.map((snapshot) => (
      <div key={snapshot.snapshotUUID}>
        <div>{snapshot.snapshotUUID}</div>
        <div>{snapshot.owner}</div>
        <div>{snapshot.tags.author}</div>
        <div>{snapshot.message}</div>
      </div>
    ));

    return (
      <div className="InventoryGroup-content InventoryGroupCommons">
        <div className="InventoryGroup-banner">
          Share and reuse content. <a href={SHARING_IN_PUBLIC_INVENTORY} target="_blank" rel="noopener noreferrer">Learn more...</a>
        </div>
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

export default connect((state, props) => ({ commons: state.commons }), {
  commonsQuery,
  commonsRetrieve,
})(InventoryGroupCommons);

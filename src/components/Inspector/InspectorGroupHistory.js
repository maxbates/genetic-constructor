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
import moment from 'moment';

import { snapshotList } from '../../middleware/snapshots';
import Spinner from './../ui/Spinner';
import Expando from './../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

export class InspectorHistory extends Component {
  static propTypes = {
    project: PropTypes.shape({
      id: PropTypes.string.isRequired,
      version: PropTypes.number.isRequired,
    }).isRequired,
  };

  //todo - should be shared
  //todo - should inherit constants
  static nameSnapshot(snapshot) {
    switch (snapshot.type) {
      case 'SNAPSHOT_PUBLISH':
        return 'Published to Commons';
      case 'SNAPSHOT_ORDER':
        return 'Project Ordered'; //todo - get foundry
      case 'SNAPSHOT_USER':
      default:
        return 'Saved Snapshot';
    }
  }

  state = {
    loading: true,
    versions: [],
    snapshots: [],
  };

  componentDidMount() {
    this.setVersionsAndSnapshots();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.project.id !== nextProps.project.id || this.props.project.version !== nextProps.project.version) {
      this.setVersionsAndSnapshots();
    }
  }

  setVersionsAndSnapshots() {
    const projectId = this.props.project.id;

    //todo - get versions
    //todo - collapse versions by day
    //todo - merge snapshots + versions (and handle when only have snapshots (e.g. public)

    snapshotList(projectId).then(snapshots => {
      this.setState({ snapshots, loading: false });
    });
  }

  render() {
    //todo - handle no shapshots
    //todo - show glyph

    if (this.state.loading) {
      return <Spinner />;
    }

    return (
      <div className="InspectorContent InspectorContentHistory">
        {this.state.snapshots.map(snapshot => {
          const time = moment(snapshot.time).format('H:mm:s');
          const name = InspectorHistory.nameSnapshot(snapshot);
          const items = [{ key: 'Version Note', value: snapshot.message }];
          const content = <InspectorDetailSection items={items} />;

          return (
            <Expando
              key={snapshot.snapshotUUID}
              text={`${time} ${name}`}
            >
              {content}
            </Expando>
          );
        })}
      </div>
    );
  }
}

export default connect(null, {})(InspectorHistory);

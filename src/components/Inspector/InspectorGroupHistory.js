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
import _ from 'lodash';

import { snapshotIsPublished } from '../../../server/data/util/commons';

import { snapshotList } from '../../middleware/snapshots';
import Spinner from './../ui/Spinner';
import Expando from './../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

export class InspectorHistory extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    projectVersion: PropTypes.number.isRequired,
  };

  //todo - should be shared, inherit constants
  static nameSnapshot(snapshot) {
    switch (snapshot.type) {
      case 'SNAPSHOT_PUBLISH':
        return 'Published to Commons';
      case 'SNAPSHOT_ORDER': {
        const foundry = snapshot.tags.foundry;
        return `Order${foundry ? ` at ${foundry}` : ''}`;
      }
      case 'SNAPSHOT_USER':
      default:
        return 'Saved Snapshot';
    }
  }

  //todo - use constants
  static snapshotIsPublished(snapshot) {
    return snapshot.tags['COMMONS_TAG'] === true;
  }

  state = {
    loading: true,
    versions: [],
    snapshots: [],
  };

  componentDidMount() {
    setSnapshots(this.props.snapshots)
    this.setVersionsAndSnapshots(this.props.projectId);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.projectId !== nextProps.projectId || this.props.projectVersion !== nextProps.projectVersion) {
      this.setVersionsAndSnapshots(nextProps.projectId);
    }
  }

  setSnapshots(snapshots, projectId) {
    this.setState({
      loading: false,
      snapshots: _(snapshots)
      .filter({ projectId })
      .orderBy(['time'], ['desc'])
      .value(),
    });
  }

  setVersionsAndSnapshots(projectId) {
    //todo - support all versions
    //todo - collapse versions by day
    //todo - merge snapshots + versions (and handle when only have snapshots (e.g. public)

    snapshotList(projectId)
    .then((snapshots) => {

    })
    .catch((err) => {
      //todo - handle error ?
    });
  }

  render() {
    //todo - enable context menu
    //todo - should be able to inline edit the snapshot message

    if (this.state.loading && !this.state.snapshots.length) {
      return <Spinner />;
    }

    return (
      <div className="InspectorContent InspectorContentHistory">
        {!this.state.snapshots.length && (
          <div className="InspectorContentPlaceholder">No snapshots created</div>
        )}

        {this.state.snapshots.map((snapshot) => {
          const time = moment(snapshot.time).format('D MMM YYYY H:mm:s');
          const name = InspectorHistory.nameSnapshot(snapshot);
          const items = [{ key: 'Version Note', value: snapshot.message }];
          const content = <InspectorDetailSection items={items} />;
          const widgets = snapshotIsPublished(snapshot) ?
            [(<img src="/images/ui/commonsVersion.svg" role="presentation" key={snapshot.snapshotUUID} />)] :
            [];

          return (
            <Expando
              key={snapshot.snapshotUUID}
              text={name}
              secondary={time}
              headerWidgets={widgets}
            >
              {content}
            </Expando>
          );
        })}
      </div>
    );
  }
}

export default connect((state, props) => ({ snapshots: state.snapshots }), {

})(InspectorHistory);

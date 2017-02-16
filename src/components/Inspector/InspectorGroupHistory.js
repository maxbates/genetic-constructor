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

import { nameSnapshot, snapshotIsPublished } from '../../../server/data/util/commons';

import { snapshotsList } from '../../actions/snapshots';
import Spinner from './../ui/Spinner';
import Expando from './../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

export class InspectorHistory extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    projectVersion: PropTypes.number.isRequired,
    snapshots: PropTypes.object.isRequired,
    snapshotsList: PropTypes.func.isRequired,
  };

  state = {
    loading: true,
    versions: [],
    snapshots: [],
  };

  componentDidMount() {
    this.setSnapshots(this.props.snapshots, this.props.projectId);
  }

  componentWillReceiveProps(nextProps) {
    const newProject = this.props.projectId !== nextProps.projectId;

    if (newProject) {
      this.setState({
        loading: true,
      });
    }

    if (newProject || this.props.projectVersion !== nextProps.projectVersion || this.props.snapshots !== nextProps.snapshots) {
      this.setSnapshots(nextProps.snapshots, nextProps.projectId);
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

  /*
  //todo - support all versions
  //todo - merge snapshots + versions (and handle when only have snapshots (e.g. public)
  setVersionsAndSnapshots(projectId) {}
  */

  //snapshots are fetched by ProjectPage when it loads a new project
  // only need this when we want to show for another project
  fetchSnapshots(projectId) {
    //will setSnapshots when props change, if there was a change
    this.props.snapshotsList(projectId)
    .then(() => this.setState({
      loading: false,
    }))
    .catch(err => {
      //if they don't own the project, will error. handle accordingly
      console.log(err);
      throw err;
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
          const name = nameSnapshot(snapshot);
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
  snapshotsList,
})(InspectorHistory);

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

import { snapshotsList } from '../../actions/snapshots';
import { commonsRetrieveProjectVersions } from '../../actions/commons';
import Spinner from './../ui/Spinner';
import Expando from './../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

export class InspectorHistory extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    projectIsPublished: PropTypes.bool.isRequired,
    snapshots: PropTypes.object.isRequired,
    snapshotsList: PropTypes.func.isRequired,
    commonsVersions: PropTypes.object.isRequired,
    commonsRetrieveProjectVersions: PropTypes.func.isRequired,
  };

  state = {
    loading: true,
    versions: [],
    snapshots: [],
  };

  componentDidMount() {
    this.setSnapshots(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const newProject = this.props.projectId !== nextProps.projectId;

    //update snapshots shown if:
    // 1) new project
    // 2) published and commons versions change
    // 3) not published and snapshots change
    if (newProject) {
      this.setSnapshots(nextProps);
    } else if (nextProps.projectIsPublished && this.props.commonsVersions !== nextProps.commonsVersions) {
      this.setSnapshots(nextProps);
    } else if (!nextProps.projectIsPublished && this.props.snapshots !== nextProps.snapshots) {
      this.setSnapshots(nextProps);
    }

    //if published, project page does not fetch versions, so do it here
    if (newProject && nextProps.projectIsPublished) {
      this.fetchSnapshots();
    }
  }

  setSnapshots(props) {
    const { projectId, projectIsPublished, snapshots, commonsVersions } = props;
    const toUse = projectIsPublished ? commonsVersions : snapshots;
    this.setState({
      loading: false,
      snapshots: _(toUse)
      .filter({ projectId })
      .orderBy(['time'], ['desc'])
      .value(),
    });
  }

  /*
   //future - support all versions
   //future - merge snapshots + versions (and handle when only have snapshots (e.g. public)
   setVersionsAndSnapshots(projectId) {}
   */

  // snapshots are fetched by ProjectPage when it loads a new project
  // only need this when we want to show for another project
  // calling action will trigger re-render on update
  fetchSnapshots() {
    const { projectId, projectIsPublished, snapshotsList, commonsRetrieveProjectVersions } = this.props;

    if (projectIsPublished) {
      return commonsRetrieveProjectVersions(projectId);
    }
    return snapshotsList(projectId);
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
          const time = snapshot.getTime();
          const name = snapshot.getNamedType();
          const items = [{ key: 'Version Note', value: snapshot.message }];
          const content = <InspectorDetailSection items={items} />;
          const widgets = snapshot.isPublished() ?
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

export default connect((state, props) => ({
  snapshots: state.snapshots,
  commonsVersions: state.commons.versions,
}), {
  snapshotsList,
  commonsRetrieveProjectVersions,
})(InspectorHistory);

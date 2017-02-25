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
import { blockStash } from '../../actions/blocks';
import { projectOpen, projectStash } from '../../actions/projects';
import {
  commonsPublish,
  commonsUnpublish,
  commonsRetrieveProject,
  commonsRetrieveProjectVersions
} from '../../actions/commons';
import { uiShowPublishDialog, uiShowMenu } from '../../actions/ui';
import Spinner from './../ui/Spinner';
import Expando from './../ui/Expando';
import InspectorDetailSection from './InspectorDetailSection';

export class InspectorHistory extends Component {
  static propTypes = {
    project: PropTypes.shape({
      id: PropTypes.string.isRequired,
      owner: PropTypes.string.isRequired,
    }).isRequired,
    userId: PropTypes.string.isRequired,
    projectIsPublished: PropTypes.bool.isRequired,
    snapshots: PropTypes.object.isRequired,
    snapshotsList: PropTypes.func.isRequired,
    commonsVersions: PropTypes.object.isRequired,
    commonsRetrieveProject: PropTypes.func.isRequired,
    commonsRetrieveProjectVersions: PropTypes.func.isRequired,
    commonsPublish: PropTypes.func.isRequired,
    commonsUnpublish: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectStash: PropTypes.func.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
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
    const newProject = this.props.project.id !== nextProps.project.id;

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

  onEditSnapshot = (snapshot) => {
    this.props.uiShowPublishDialog(true, snapshot.version);
  };

  onContextMenu = (snapshot, evt) => {
    this.props.uiShowMenu([
      {
        text: 'Duplicate as New Project',
        action: () => {
          this.props.commonsRetrieveProject(snapshot.projectId, snapshot.version, false)
          .then(roll => {
            const clone = roll.clone(this.props.userId);
            this.props.projectStash(clone.project);
            this.props.blockStash(..._.values(clone.blocks));
            this.props.projectOpen(clone.project.id);
          });
        },
      },
      {
        text: 'Edit...',
        disabled: this.props.userId !== snapshot.owner,
        action: () => this.onEditSnapshot(snapshot),
      },
      {
        text: snapshot.isPublished() ? 'Unpublish...' : 'Publish Snapshot...',
        disabled: this.props.userId !== snapshot.owner,
        action: () => {
          if (snapshot.isPublished()) {
            this.props.commonsUnpublish(snapshot.projectId, snapshot.version);
          } else {
            this.props.commonsPublish(snapshot.projectId, snapshot.version);
          }
        },
      },
    ], {
      x: evt.pageX,
      y: evt.pageY,
    });
  };

  setSnapshots(props) {
    const { project, projectIsPublished, snapshots, commonsVersions } = props;
    const projectId = project.id;
    const toUse = projectIsPublished ? commonsVersions : snapshots;
    this.setState({
      loading: false,
      snapshots: _(toUse)
      .filter({ projectId })
      .orderBy(['created'], ['desc'])
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
    const { project, projectIsPublished, snapshotsList, commonsRetrieveProjectVersions } = this.props;
    const projectId = project.id;

    if (projectIsPublished) {
      return commonsRetrieveProjectVersions(projectId);
    }
    return snapshotsList(projectId);
  }

  render() {
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
          // NB - should only be active if the projectId is the one in the canvas
          const headerGlyphs = (this.props.userId !== this.props.project.owner) ? [] : [
              <img
                key="open"
                role="presentation"
                src="/images/ui/edit-dark.svg"
                onClick={evt => this.onEditSnapshot(snapshot)}
                className="InspectorDetailSection-headerGlyph"
              />,
            ];
          const content = <InspectorDetailSection items={items} headerGlyphs={headerGlyphs} />;
          const widgets = snapshot.isPublished() ?
            [(<img src="/images/ui/commonsVersion.svg" role="presentation" key={snapshot.snapshotUUID} />)] :
            [];

          return (
            <Expando
              key={snapshot.snapshotUUID}
              text={name}
              secondary={time}
              headerWidgets={widgets}
              onContextMenu={evt => this.onContextMenu(snapshot, evt)}
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
  userId: state.user.userid,
  snapshots: state.snapshots,
  commonsVersions: state.commons.versions,
}), {
  snapshotsList,
  commonsRetrieveProject,
  commonsRetrieveProjectVersions,
  commonsPublish,
  commonsUnpublish,
  blockStash,
  projectOpen,
  projectStash,
  uiShowPublishDialog,
  uiShowMenu,
})(InspectorHistory);

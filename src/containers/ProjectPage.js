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

import { focusConstruct } from '../actions/focus';
import { projectSave, projectLoad, projectOpen } from '../actions/projects';
import { snapshotsList } from '../actions/snapshots';
import { commonsRetrieveProjectVersions } from '../actions/commons';

import ProjectDetail from '../components/ProjectDetail';
import ProjectHeader from '../components/ProjectHeader';
import ImportGenBankModal from '../components/genbank/import';
import ImportDNAForm from '../components/importdna/importdnaform';
import ImportPartsCSVModal from '../components/importpartscsv/importpartscsv';
import SaveErrorModal from '../components/modal/SaveErrorModal';
import PublishModal from '../components/modal/PublishModal';
import UnpublishModal from '../components/modal/UnpublishModal';
import DeleteProjectModal from '../components/modal/DeleteProjectModal';
import OrderModal from '../containers/orders/ordermodal';
import Inspector from './Inspector';
import Inventory from './Inventory';
import Spinner from '../components/ui/Spinner';

import loadAllExtensions from '../extensions/loadExtensions';
import ConstructViewerCanvas from './graphics/views/constructViewerCanvas';

import '../styles/ProjectPage.css';
import '../styles/SceneGraphPage.css';

export class ProjectPage extends Component {
  static propTypes = {
    userId: PropTypes.string,
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object, //if have a project (not fetching)
    constructs: PropTypes.array, //if have a project (not fetching)
    projectFromCommons: PropTypes.bool, //if have a project (not fetching) //eslint-disable-line
    projectSave: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    commonsRetrieveProjectVersions: PropTypes.func.isRequired, //eslint-disable-line react/no-unused-prop-types
    snapshotsList: PropTypes.func.isRequired, //eslint-disable-line react/no-unused-prop-types
    autosave: PropTypes.shape({
      dirty: PropTypes.bool.isRequired,
    }),
  };

  // lazily fetch snapshots / commons snapshots
  static fetchSnapshotsAndCommons(props) {
    // if user owns the project...
    // get all the projects snapshots lazily, will re-render when have them
    // run in project page so only request them when we actually load the project
    //todo - validate id better
    if (!props.projectFromCommons) {
      props.snapshotsList(props.projectId)
      .catch((err) => {});
    }

    //independent of whether owned or not, get all published versions so we can better handle publish / unpublish functionality enabled
    props.commonsRetrieveProjectVersions(props.projectId)
    .catch((err) => {});
  }

  componentDidMount() {
    // future - use react router History to do this:
    // https://github.com/mjackson/history/blob/master/docs/ConfirmingNavigation.md
    window.onbeforeunload = window.onunload = this.onWindowUnload.bind(this);

    //load extensions (also see componentWillReceiveProps)
    if (this.props.userId) {
      loadAllExtensions();
    }
  }

  componentWillReceiveProps(nextProps) {
    //does not run on initial load
    if (!!nextProps.project && Array.isArray(nextProps.project.components) && (!this.props.projectId || nextProps.projectId !== this.props.projectId)) {
      //focus construct if there is one
      if (nextProps.project.components.length) {
        this.props.focusConstruct(nextProps.project.components[0]);
      }

      ProjectPage.fetchSnapshotsAndCommons(nextProps);
    }

    //if the user has changed... we reload the page, but just in case...
    //reload extensions if user changed
    //really, this should go in the store
    if (this.props.userId !== nextProps.userId && nextProps.userId) {
      loadAllExtensions();
    }
  }

  componentWillUnmount() {
    window.onbeforeunload = window.onunload = () => {};
  }

  onWindowUnload(evt) {
    if (this.props.autosave && this.props.autosave.dirty === true && process.env.NODE_ENV === 'production') {
      //initiate a save in the background
      this.props.projectSave(this.props.projectId);
      //string is required return
      return 'Project has unsaved work! Please save before leaving this page';
    }
  }

  render() {
    const { project, projectId, constructs, projectFromCommons } = this.props;

    //handle project not loaded at all
    if (!project || !project.metadata) {
      this.props.projectLoad(projectId, false, true)
      .then((rollup) => {
        if (rollup.project.id !== projectId) {
          this.props.projectOpen(rollup.project.id);
        }
      });
      return (<Spinner styles={{ fontSize: '40px', margin: '2em auto' }} />);
    }

    //check if the project is fully loaded (i.e. blocks have been loaded)
    // todo - currently, leads to infinite loop of requests
    //if (project && project.components.length && project.components.some(constructId => !constructs[constructId])) {
    //  this.props.projectLoad(projectId);
    //  return (<Spinner styles={{ fontSize: '40px', margin: '2em auto' }} />);
    //}

    return (
      <div className="ProjectPage">
        <ImportGenBankModal currentProjectId={projectId} />
        <ImportDNAForm />
        <ImportPartsCSVModal />
        <SaveErrorModal />
        <OrderModal projectId={projectId} />
        <DeleteProjectModal currentProjectId={projectId} />
        <PublishModal projectId={projectId} />
        <UnpublishModal projectId={projectId} />

        <Inventory currentProjectId={projectId} />

        <div className="ProjectPage-content">

          <ProjectHeader
            project={project}
            readOnly={projectFromCommons || project.isFrozen()}
          />

          <ConstructViewerCanvas
            currentProjectId={projectId}
            constructs={constructs}
          />

          <ProjectDetail project={project} />
        </div>

        <Inspector projectId={projectId} />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const userId = state.user.userid;
  const autosave = state.autosave;

  const projectId = ownProps.params.projectId;
  const project = state.projects[projectId];

  if (!project) {
    return {
      projectId,
    };
  }

  const projectFromCommons = project.owner !== userId;

  const constructs = project.components.map(componentId => state.blocks[componentId]);

  return {
    projectId,
    project,
    projectFromCommons,
    constructs,
    userId,
    autosave,
  };
}

export default connect(mapStateToProps, {
  projectSave,
  projectLoad,
  projectOpen,
  focusConstruct,
  commonsRetrieveProjectVersions,
  snapshotsList,
})(ProjectPage);

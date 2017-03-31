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

import Snapshot from '../../models/Snapshot';
import { uiSetGrunt, uiShowProjectDeleteModal } from '../../actions/ui';
import { blockCreate } from '../../actions/blocks';
import {
  projectAddConstruct,
  projectCreate,
  projectDelete,
  projectLoad,
  projectOpen,
  projectSave,
} from '../../actions/projects';
import { focusConstruct } from '../../actions/focus';
import { snapshotsList } from '../../actions/snapshots';
import Rollup from '../../models/Rollup';
import * as instanceMap from '../../store/instanceMap';

import Modal from './Modal';
import ModalFooter from './ModalFooter';

class DeleteProjectModal extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    currentProjectId: PropTypes.string.isRequired, //eslint-disable-line react/no-unused-prop-types
    project: PropTypes.object.isRequired,
    projects: PropTypes.object.isRequired,
    snapshots: PropTypes.object.isRequired,
    open: PropTypes.bool,
    snapshotsList: PropTypes.func.isRequired,
    blockCreate: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectDelete: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowProjectDeleteModal: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      isPublished: _.some(_.filter(props.snapshots, { projectId: props.projectId }), Snapshot.isPublished),
    };
  }

  componentDidMount() {
    this.props.snapshotsList(this.props.projectId);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.snapshots !== nextProps.snapshots) {
      this.setState({
        isPublished: _.some(_.filter(nextProps.snapshots, { projectId: nextProps.projectId }), Snapshot.isPublished),
      });
    }
  }

  actions = [{
    text: 'Delete',
    onClick: () => this.handleDelete(),
  }];

  handleDelete() {
    this.props.uiShowProjectDeleteModal(false);

    if (this.props.project.rules.frozen) {
      this.props.uiSetGrunt('This is a sample project and cannot be deleted.');
      return;
    }

    if (this.state.isPublished) {
      this.props.uiSetGrunt('The project cannot be deleted because it is shared in the Public inventory.');
      return;
    }

    const projectId = this.props.projectId;

    //make sure we have another project
    const nextProject = _(this.props.projects)
    .filter(project => !project.rules.frozen)
    .orderBy(['metadata.created'], ['desc'])
    .find(manifest => manifest.id !== projectId);

    //if no other projects, create and save another one first
    if (!nextProject) {
      const newProject = this.createNewProject();
      return this.props.projectSave(newProject.project.id, true)
      .then(() => {
        console.log('Delete Project Action:', projectId);
        console.log('PROPS:', this.props.projectId);
        debugger;
        this.props.projectDelete(this.props.projectId);
      });
    }

    //to gracefully delete...
    //load another project, avoiding this one
    this.props.projectLoad(nextProject.id, false, [projectId])
    //open the new project, skip saving the previous one
    .then(roll => this.props.projectOpen(roll.project.id, true))
    //delete after we've navigated so dont trigger project page to complain about not being able to laod the project
    .then(() => {
      console.log('Delete Project Action:', projectId);
      console.log('PROPS:', this.props.projectId);
      debugger;
      this.props.projectDelete(projectId);
    });
  }

  //todo - share with InventoryProjectTree better
  createNewProject() {
    // create project and add a default construct
    const project = this.props.projectCreate();
    // add a construct to the new project
    const block = this.props.blockCreate({ projectId: project.id });
    const projectWithConstruct = this.props.projectAddConstruct(project.id, block.id, true);
    const rollup = new Rollup({
      project: projectWithConstruct,
      blocks: {
        [block.id]: block,
      },
    });

    //save this to the instanceMap as cached version, so that when projectSave(), will skip until the user has actually made changes
    //do this outside the actions because we do some mutations after the project + construct are created (i.e., add the construct)
    instanceMap.saveRollup(rollup);

    this.props.focusConstruct(block.id);
    this.props.projectOpen(project.id);

    return rollup;
  }

  render() {
    if (!this.props.open) {
      return null;
    }

    return (
      <Modal
        isOpen={this.props.open}
        onClose={() => this.props.uiShowProjectDeleteModal(false)}
        title={'Delete Project'}
      >
        <div className="DeleteProjectModal Modal-paddedContent" style={{ textAlign: 'center' }}>
          <p><b>{this.props.project.getName() || 'Your project'}</b> and all related project data will be permanently
            deleted.</p>
          <br />
          <p>This action cannot be undone.</p>
        </div>
        <ModalFooter actions={this.actions} />
      </Modal>
    );
  }
}

export default connect((state, props) => {
  const projectId = state.ui.modals.projectDeleteForceProjectId || props.currentProjectId;
  return {
    projectId,
    projects: state.projects,
    snapshots: state.snapshots,
    open: state.ui.modals.projectDeleteDialog,
    project: state.projects[projectId],
  };
}, {
  blockCreate,
  projectLoad,
  projectCreate,
  projectAddConstruct,
  projectOpen,
  projectSave,
  projectDelete,
  focusConstruct,
  snapshotsList,
  uiSetGrunt,
  uiShowProjectDeleteModal,
})(DeleteProjectModal);

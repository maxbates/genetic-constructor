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

import { uiShowPublishDialog } from '../../actions/ui';
import {
  projectRename,
  projectSetDescription,
  projectSetKeywords,
  projectPublish,
} from '../../actions/projects';
import Modal from './Modal';
import ModalFooter from './ModalFooter';

import '../../styles/PublishModal.css';

class PublishModal extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
    projectPublish: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
    projectSetDescription: PropTypes.func.isRequired,
    projectSetKeywords: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.actions = [{
      text: 'Publish',
      onClick: () => this.props.projectPublish(this.props.projectId),
      disabled: () => !this.formValid(),
    }];

    this.state = {
      versionNote: '',
    };
  }

  formValid() {
    const { project } = this.props;

    return project.metadata.name &&
      project.metadata.description &&
      project.keywords.length > 0;
  }

  render() {
    if (!this.props.open) {
      return null;
    }

    return (
      <Modal
        isOpen
        onClose={() => this.props.uiShowPublishDialog(false)}
        title={'Publish'}
      >
        <div>Hi</div>

        <ModalFooter actions={this.actions} />
      </Modal>
    );
  }
}

export default connect((state, props) => ({
  project: state.projects[props.projectId],
  open: state.ui.modals.publishDialog,
}), {
  projectRename,
  projectSetDescription,
  projectSetKeywords,
  projectPublish,
  uiShowPublishDialog,
})(PublishModal);

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
import FormGroup from '../formElements/FormGroup';
import FormText from '../formElements/FormText';
import Checkbox from '../formElements/Checkbox';

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
      name: props.project.metadata.name,
      description: props.project.metadata.description,
      keywords: props.project.metadata.keywords,
    };
  }

  onSubmit = (evt) => {
    //todo - update project with state metadata
    //todo - submit (need an action)
  };

  formValid() {
    const { project } = this.props;

    return project.metadata.name &&
      project.metadata.description &&
      project.keywords.length > 0;
  }

  render() {
    const { open } = this.props;
    const { name, description, keywords, versionNote } = this.state;

    if (open !== true) {
      return null;
    }

    return (
      <Modal
        isOpen
        onClose={() => this.props.uiShowPublishDialog(false)}
        title={'Publish'}
      >
        <form
          id="publish-modal"
          className="Form"
          onSubmit={this.onSubmit}
        >
          <div className="Modal-paddedContent">
            <div className="Modal-banner">
              <span>Share a version of your project in the Genetic Constructor Public Inventory. <a href="">Learn more...</a></span>
            </div>

            <FormGroup label="Project Title*">
              <FormText
                value={name}
                name="name"
                placeholder="Title of your project"
                onChange={evt => this.setState({ name: evt.target.value })}
              />
            </FormGroup>

            <FormGroup label="Project Description*">
              <FormText
                value={description}
                name="description"
                placeholder="Decription of your project"
                onChange={evt => this.setState({ description: evt.target.value })}
              />
            </FormGroup>

            <FormGroup label="Keywords*">
              <FormText
                value={keywords.join(',')}
                name="keywords"
                placeholder="Enter keywords to help people find your project"
                onChange={evt => this.setState({ keywords: evt.target.value.split(',') })}
              />
            </FormGroup>

            <FormGroup label="Version Note">
              <FormText
                value={versionNote}
                name="keywords"
                placeholder="Provide information about this version (optional)"
                onChange={evt => this.setState({ versionNote: evt.target.value })}
              />
            </FormGroup>

            <FormGroup label="License" labelTop>
              <div style={{ width: '350px' }}>
                <p>By selecting &apos;Publish&apos; below, you agree that your project will become available
                  license-free in the public domain under the Create Commons CCØ license. Learn more...</p>
                <p><a href="mailto:support@geneticconstructor.com">Contact us</a> if your project requires a more
                  restrictive license.</p>
              </div>
            </FormGroup>

          </div>
          <ModalFooter actions={this.actions} />
        </form>
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

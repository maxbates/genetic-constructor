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

import { commonsUnpublish } from '../../middleware/commons';
import { uiSetGrunt, uiShowUnpublishDialog } from '../../actions/ui';
import Modal from './Modal';
import ModalFooter from './ModalFooter';
import FormGroup from '../formElements/FormGroup';
import FormRadio from '../formElements/FormRadio';

class UnpublishModal extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    projectVersion: PropTypes.number,
    open: PropTypes.bool.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowUnpublishDialog: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.actions = [{
      text: 'Remove',
      danger: true,
      onClick: this.onSubmit,
    }, {
      text: 'Cancel',
      type: 'submit',
      secondary: true,
      onClick: () => props.uiShowUnpublishDialog(false),
    }];

    this.state = {
      everything: !Number.isInteger(props.projectVersion),
    };
  }

  onSubmit = (evt) => {
    evt.preventDefault();
    const { projectId, projectVersion } = this.props;
    const { everything } = this.state;

    const version = everything ? undefined : projectVersion;

    ///todo  - should be an action so can update the store?

    commonsUnpublish(projectId, version)
    .then(() => {
      this.props.uiShowUnpublishDialog(false);
      this.props.uiSetGrunt('Your project was successfully removed from the commons');
    })
    .catch((err) => {
      console.log(err); //eslint-disable-line
      this.props.uiSetGrunt('There was a problem removing your project from the commons.');
      throw err;
    });
  };

  render() {
    const { open, uiShowUnpublishDialog, projectVersion } = this.props;

    if (open !== true) {
      return null;
    }

    return (
      <Modal
        isOpen
        onClose={() => uiShowUnpublishDialog(false)}
        title="Remove from Public?"
      >
        <div className="Modal-paddedContent">
          <div className="Modal-banner">
            Removing project data from the Public Inventory will take effect immediately.
          </div>

          <FormGroup label="Remove" centered labelTop>
            <div>
              <FormRadio
                checked={!this.state.everything}
                disabled={!Number.isInteger(projectVersion)}
                name="unpublishType"
                value="selectedVersion"
                onChange={() => this.setState({ everything: false })}
                label="Selected version snapshot only"
              />
              <FormRadio
                checked={this.state.everything}
                name="unpublishType"
                value="entireProject"
                onChange={() => this.setState({ everything: true })}
                label="Entire project"
              />
            </div>
          </FormGroup>

        </div>
        <ModalFooter actions={this.actions} />
      </Modal>
    );
  }
}

export default connect((state, props) => ({
  open: state.ui.modals.unpublishDialog,
  projectVersion: state.ui.modals.unpublishDialogVersion,
}), {
  uiShowUnpublishDialog,
  uiSetGrunt,
})(UnpublishModal);

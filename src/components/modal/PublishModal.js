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
import Modal from './Modal';

import '../../styles/PublishModal.css';

class PublishModal extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
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
      </Modal>
    );
  }
}

export default connect((state, props) => ({
  open: state.ui.modals.publishDialog,
}), {
  uiShowPublishDialog,
})(PublishModal);

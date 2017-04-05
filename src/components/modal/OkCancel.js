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
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import '../../styles/ok-cancel-form.css';
import Modal from '../modal/Modal';
import ModalFooter from '../modal/ModalFooter';

/**
 * generic ok/cancel dialog, available via uiShowOkCancel action
 * todo - need to update the action + expected functions + sane defaults to close if functions not present
 */
export function OkCancel(props) {
  const { title, message, okText, onOk, onCancel } = props;

  if (!title) {
    return null;
  }

  const onSubmit = (evt) => {
    evt.preventDefault();
    if (onOk) {
      onOk();
    }
  };

  const onClose = (evt) => {
    if (onCancel) {
      onCancel();
    }
  };

  const actions = [{
    text: okText || 'Continue...',
    onClick: onSubmit,
  }];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
    >
      <div className="Modal-paddedContent">
        <form
          className="Form ok-cancel-form"
          onSubmit={(evt) => {
            evt.preventDefault();
            this.props.onOk();
          }}
        >
          <div className="message">{message}</div>
        </form>
      </div>
      <ModalFooter actions={actions} />
    </Modal>
  );
}

OkCancel.propTypes = {
  title: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  okText: PropTypes.string,
  onOk: PropTypes.func,
  onCancel: PropTypes.func,
};

function mapStateToProps(state, props) {
  return {
    title: state.ui.modals.title,
    message: state.ui.modals.message,
    onOk: state.ui.modals.onOk,
    onCancel: state.ui.modals.onCancel,
    okText: state.ui.modals.okText,
    cancelText: state.ui.modals.cancelText,
  };
}

export default connect(mapStateToProps)(OkCancel);

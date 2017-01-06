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

import {
  uiShowOkCancel,
} from '../actions/ui';
import ModalWindow from './modal/modalwindow';

import '../styles/ok-cancel-form.css';

/**
 * generic ok/cancel dialog, available via uiShowOkCancel action
 */
class OkCancel extends Component {
  static propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    okText: PropTypes.string,
    cancelText: PropTypes.string,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    uiShowOkCancel: PropTypes.func,
  };

  render() {
    if (!this.props.title) {
      return null;
    }
    return (
      <div>
        <ModalWindow
          open={!!this.props.title}
          title={this.props.title}
          payload={(
            <form
              className="gd-form ok-cancel-form"
              onSubmit={(evt) => {
                evt.preventDefault();
                this.props.onOk();
              }}
            >
              <div className="title">{this.props.title}</div>
              <div className="message">{this.props.message}</div>
              <br/>
              <button type="submit">{this.props.okText}</button>
              <button
                type="button"
                onClick={(evt) => {
                  evt.preventDefault();
                  if (this.props.onCancel) {
                    this.props.onCancel();
                  }
                }}
              >{this.props.cancelText}
              </button>
            </form>

          )}
          closeOnClickOutside
          closeModal={(buttonText) => {

          }}
        />
      </div>
    );
  }
}

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

export default connect(mapStateToProps, {
  uiShowOkCancel,
})(OkCancel);


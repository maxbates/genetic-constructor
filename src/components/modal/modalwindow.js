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

import '../../../src/styles/modal-old.css';

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
export default class ModalWindow extends Component {
  static propTypes = {
    open: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    closeOnClickOutside: PropTypes.bool,
    payload: PropTypes.object.isRequired,
  };

  componentDidMount() {
    setTimeout(() => {
      if (this.modal) {
        this.modal.style.transform = 'translate(-50%, 0px)';
      }
    }, 10);
  }

  // mouse down on the blocker closes the modal, if props.closeOnClickOutside is true
  onMouseDown = (evt) => {
    if (evt.target === this.blocker && this.props.closeOnClickOutside) {
      this.props.closeModal();
    }
  };

  /*
   * render modal dialog with owner supplied payload and optional buttons.
   */
  render() {
    // only render contents if open
    const contents = this.props.open
      ?
      (
        <div
          ref={(el) => { this.modal = el; }}
          className="modal-window no-vertical-scroll"
        >
          {this.props.payload}
        </div>
      )
      :
      null;
    return (
      <div
        onMouseDown={this.onMouseDown}
        className={this.props.open ? 'modal-blocker-visible' : 'modal-blocker-hidden'}
        ref={(el) => { this.blocker = el; }}
      >
        {contents}
      </div>
    );
  }
}

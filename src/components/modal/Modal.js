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

// this is the new version of the Constructor modal
// it extends the ReactModel component

import React, { Component, PropTypes } from 'react';
import ReactModal from 'react-modal';

import '../../styles/Modal.css';

export default class Modal extends Component {
  // properties are documented at react-modal component:
  // https://reactcommunity.org/react-modal/
  // notably, the parent of this component is responsible for state management of isOpen, + responding to onClose
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onAfterOpen: PropTypes.func,
    parentSelector: PropTypes.func,
  };

  componentDidMount() {
    setTimeout(() => {
      if (this.modal) {
        console.log(this.modal);
        //todo - this is not actually an element. need to get the element
        this.modal.node.classList.add('Modal--open');
      }
    }, 10);
  }

  handleClose = evt => this.props.onClose(evt);

  render() {
    const { children, title, ...rest } = this.props;

    return (
      <ReactModal
        className="Modal"
        overlayClassName="Modal-overlay"
        portalClassName="Modal-portal"
        shouldCloseOnOverlayClick
        contentLabel={title}
        {...rest}
        ref={(el) => { this.modal = el; }}
        onRequestClose={this.handleClose}
      >
        <div className="Modal-header">
          <div className="Modal-header-title">{title}</div>
          <div className="Modal-header-close">&times;</div>
        </div>
        <div className="Modal-content">
          {children}
        </div>
      </ReactModal>
    );
  }
}

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

import ModalFooter from './ModalFooter';

import '../styles/Modal.css';

//based on ReactModal component: https://reactcommunity.org/react-modal/
//can be mounted inside a component, or at the app root. Uses a portal to render appropriately in whole window.

export default class Modal extends Component {
  static propTypes = {
    //isOpen is necessary to render children
    isOpen: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    //can pass actions, or render yourself using ModalFooter component
    //e.g. dont pass in if dependent on child state dependent, may not update
    actions: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    })),
    onAfterOpen: PropTypes.func,
    parentSelector: PropTypes.func, //return element to mount modal portal in
    style: PropTypes.shape({
      overlay: PropTypes.object,
      content: PropTypes.object,
    }),
  };

  componentDidMount() {
    setTimeout(() => {
      if (this.modal) {
        //adds class to the portal
        this.modal.node.classList.add('Modal--open');
      }
    }, 10);
  }

  render() {
    const { children, title, actions, ...rest } = this.props;

    return (
      <ReactModal
        className="Modal-content"
        overlayClassName="Modal-overlay"
        portalClassName="Modal-portal"
        shouldCloseOnOverlayClick
        contentLabel={title}
        {...rest}
        ref={(el) => { this.modal = el; }}
        onRequestClose={this.props.onClose}
      >
        <div className="Modal-header">
          <div className="Modal-header-space" />
          <div className="Modal-header-title">{title}</div>
          <div className="Modal-header-close" onClick={this.props.onClose} />
        </div>

        <div className="Modal-inner">
          {children}
          {actions && <ModalFooter actions={actions} />}
        </div>
      </ReactModal>
    );
  }
}

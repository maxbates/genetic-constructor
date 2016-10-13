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

import '../../../src/styles/Modal.css';
import '../../../src/styles/inline-editor.css';

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
export default class InlineEditor extends Component {
  static propTypes = {
    commit: PropTypes.func.isRequired,
    cancel: PropTypes.func,
    position: PropTypes.object.isRequired,
  };

  /*
   * render the inline editor only when the commit callback is available
   */
  render() {
    if (!this.props.commit) {
      return null;
    }
    return (
      <div className="modal-blocker-visible">
        <div className="inline-editor">
        </div>
      </div>
    );
  }
}

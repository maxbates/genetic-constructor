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

import '../../../src/styles/Modal.css';
import '../../../src/styles/inline-editor.css';

import {
  uiInlineEditor,
} from '../../actions/ui';

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
class InlineEditor extends Component {
  static propTypes = {
    commit: PropTypes.func.isRequired,
    cancel: PropTypes.func,
    position: PropTypes.object.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
  };

  onCommit = () => {
    this.props.uiInlineEditor();
    this.props.commit(this.refs.input.value);
  }

  /**
   * make sure the click was on the block and not the input
   */
  onClickBlock = (evt) => {
    if (evt.target === this.refs.blocker) {
      this.onCommit();
    }
  }


  /*
   * render the inline editor only when the commit callback is available
   */
  render() {
    if (!this.props.commit) {
      return null;
    }
    return (
      <div ref="blocker" className="modal-blocker-visible" onClick={this.onClickBlock}>
        <input ref="input" className="inline-editor" onBlur={this.onBlur}/>
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    this.doFocus = !this.props.commit && nextProps.commit;
  }

  componentDidUpdate() {
    if (this.doFocus) {
      this.refs.input.focus();
      this.doFocus = false;
    }
  }
}

function mapStateToProps(state, props) {
  return {};
}

export default connect(mapStateToProps, {
  uiInlineEditor,
})(InlineEditor);

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
    value: PropTypes.string.isRequired,
    position: PropTypes.object.isRequired,
    extraClassName: PropTypes.string,
    uiInlineEditor: PropTypes.func.isRequired,
  };

  onCommit = () => {
    this.props.uiInlineEditor();
    this.props.commit(this.refs.input.value);
  };

  onCancel = () => {
    this.props.uiInlineEditor();
  };

  /**
   * enter key commits change, escape cancels
   */
  onKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.onCommit();
    }
    if (event.key === 'Escape') {
      this.onCancel();
    }
  };

  onBlur = () => {
    this.onCommit();
  }

  /*
   * render the inline editor only when the commit callback is available
   */
  render() {
    if (!this.props.commit) {
      return null;
    }
    const styles = {
      left: this.props.position.left + 'px',
      top: this.props.position.top + 'px',
      width: this.props.position.width + 'px',
      height: this.props.position.height + 'px',
    };
    const classes = `inline-editor${this.props.extraClassName ? ' ' + this.props.extraClassName : ''}`;
    return (
      <div>
        <input
          style={styles}
          ref="input"
          defaultValue={this.props.value}
          className={classes}
          onKeyDown={this.onKeyDown}
          onBlur={this.onBlur}
          spellCheck={false}
        />
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

  /**
   * listen to window resize/scroll and cancel the change if it occurs when the editor is open
   */
  componentDidMount() {
    window.addEventListener('resize', this.onCancel);
    window.addEventListener('mousewheel', this.onCancel);
  }

  /**
   * unlisten on unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.onCancel);
    window.removeEventListener('mousewheel', this.onCancel);
  }
}

function mapStateToProps(state, props) {
  return {};
}

export default connect(mapStateToProps, {
  uiInlineEditor,
})(InlineEditor);

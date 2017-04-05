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

import '../../styles/ribbongrunt.css';
import { uiSetGrunt } from '../../actions/ui';

class RibbonGrunt extends Component {
  static propTypes = {
    gruntMessage: PropTypes.string,
    gruntTime: PropTypes.number,
    uiSetGrunt: PropTypes.func.isRequired,
    atTop: PropTypes.bool,
  };

  // if we going to show a message then start or extend the close timer
  componentWillReceiveProps(nextProps) {
    window.clearTimeout(this.closeTimer);
    const { gruntMessage, gruntTime } = nextProps;
    if (gruntMessage && gruntTime > 0) {
      this.closeTimer = window.setTimeout(this.close.bind(this), gruntTime);
    }
  }

  close = () => {
    window.clearTimeout(this.closeTimer);
    this.props.uiSetGrunt('');
  };

  render() {
    const { gruntMessage } = this.props;

    const message = gruntMessage || this.lastMessage;
    this.lastMessage = gruntMessage;

    const classes = `ribbongrunt ${
      gruntMessage ? 'ribbongrunt-visible' : 'ribbongrunt-hidden'}${
      this.props.atTop ? ' atTop' : ''}`;

    return (
      <div className={classes}>
        <span>{message}
          <img src="/images/ui/close_icon_dark.svg" onClick={this.close} />
        </span>

      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    gruntMessage: state.ui.modals.gruntMessage,
    gruntTime: state.ui.modals.gruntTime,
  };
}
export default connect(mapStateToProps, {
  uiSetGrunt,
})(RibbonGrunt);

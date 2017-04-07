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
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import { uiSetGrunt, uiShowAuthenticationForm, uiShowMenu } from '../../actions/ui';
import { userLogout } from '../../actions/user';
import Box2D from '../../graphics/geometry/box2d';
import Vector2D from '../../graphics/geometry/vector2d';
import '../../styles/userwidget.css';

class UserWidget extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    user: PropTypes.object,
    userLogout: PropTypes.func.isRequired,
    userWidgetVisible: PropTypes.bool.isRequired,
  };

  /**
   * show the content menu
   */
  onShowMenu = () => {
    const box = new Box2D(ReactDOM.findDOMNode(this).getBoundingClientRect());
    const menuPosition = new Vector2D(box.cx, box.bottom).add(new Vector2D(-20, -4));
    const name = `${this.props.user.firstName} ${this.props.user.lastName}`;

    this.props.uiShowMenu([
      {
        text: name,
        disabled: true,
      },
      {
        text: 'Account Settings',
        action: () => {
          this.props.uiShowAuthenticationForm('account');
        },
      },
      {
        text: 'Sign Out',
        action: this.signOut,
      },
    ],
    menuPosition, false);
  };

  signOut = () => {
    this.props.userLogout()
    .catch((reason) => {
      this.props.uiSetGrunt('There was a problem signing you out');
    });
  };

  render() {
    if (!this.props.userWidgetVisible) {
      return null;
    }

    return (
      <div className="userwidget">
        <img onClick={this.onShowMenu} src="/images/ui/user.svg" />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
    userWidgetVisible: state.ui.modals.userWidgetVisible,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiSetGrunt,
  uiShowMenu,
  userLogout,
})(UserWidget);

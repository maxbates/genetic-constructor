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
import { uiShowAuthenticationForm, uiSetGrunt } from '../../actions/ui';
import { userLogout } from '../../actions/user';

import '../../styles/InspectorGroupSettings.css';

class InspectorGroupSettings extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    userLogout: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
  };


  onAccountSettings = (event) => {
    event.preventDefault();
    this.props.uiShowAuthenticationForm('account');
  };

  onLogOut = (event) => {
    event.preventDefault();
    this.props.userLogout()
    .catch((reason) => {
      this.props.uiSetGrunt('There was a problem signing you out');
    });
  };

  render() {
    return (<div className="InspectorGroupSettings">
      <a onClick={this.onAccountSettings} href="#">Account Settings</a>
      <a onClick={this.onLogOut} href="#">Sign Out</a>
    </div>);
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  userLogout,
  uiSetGrunt,
})(InspectorGroupSettings);


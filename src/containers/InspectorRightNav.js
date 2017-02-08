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
import UserWidget from '../components/authentication/userwidget';
import AutosaveTracking from '../components/GlobalNav/autosaveTracking';


export default class InspectorRightNav extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    isVisible: PropTypes.bool.isRequired,
  };

  render() {
    let autoSave;
    if (this.props.currentProjectId && this.props.isVisible) {
      autoSave = <AutosaveTracking projectId={this.props.currentProjectId} />;
    }
    return (
      <div className="right-nav" >
        <UserWidget />
        {autoSave}
      </div>
    );
  }
}

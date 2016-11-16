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

import InspectorGroupInformation from './InspectorGroupInformation';
import InspectorGroupHelp from './InspectorGroupHelp';
import InspectorGroupFeedback from './InspectorGroupFeedback';
import InspectorGroupExtensions from './InspectorGroupExtensions';
import InspectorGroupSettings from './InspectorGroupSettings';

import '../../styles/InspectorGroup.css';

export default class InspectorGroup extends Component {
  static propTypes = {
    tabInfo: PropTypes.object.isRequired,
    projectId: PropTypes.string.isRequired,
  };

  inspectorGroupTypeToComponent = (type) => {
    switch (type) {
    case 'information' :
      return (<InspectorGroupInformation projectId={this.props.projectId} />);
    case 'help' :
      return (<InspectorGroupHelp />);
    case 'feedback' :
      return (<InspectorGroupFeedback />);
    case 'extensions' :
      return (<InspectorGroupExtensions />);
    case 'settings' :
      return (<InspectorGroupSettings />);
    default:
      //throw new Error(`Type ${type} is not registered in InspectorGroup`);
    }
  };

  render() {
    const { type } = this.props.tabInfo;
    const currentGroupComponent = this.inspectorGroupTypeToComponent(type);
    return (
      <div className={'InspectorGroup'}>
        {currentGroupComponent}
      </div>
    );
  }
}

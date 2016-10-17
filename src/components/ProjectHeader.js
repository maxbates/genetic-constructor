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
import {connect } from 'react-redux';
import {
  inspectorToggleVisibility,
  uiInlineEditor,
} from '../actions/ui';
import { focusPrioritize } from '../actions/focus';
import { projectRename } from '../actions/projects';

import '../styles/ProjectHeader.css';

class ProjectHeader extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    isFocused: PropTypes.bool.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
  };

  onClick = () => {
    this.props.inspectorToggleVisibility(true);
    this.props.focusPrioritize('project');
    const bounds = ReactDOM.findDOMNode(this).getBoundingClientRect();
    const name = this.props.project.metadata.name || 'Untitled Project'
    this.props.uiInlineEditor(value => {
      this.props.projectRename(this.props.project.id, value);
    }, name, bounds, 'inline-editor-project', ReactDOM.findDOMNode(this));
  };

  render() {
    const { project, isFocused } = this.props;

    return (
      <div className={'ProjectHeader' + (isFocused ? ' focused' : '')}
           onClick={this.onClick}>
        <div className="ProjectHeader-info">
          <div className="ProjectHeader-title">{project.metadata.name || 'Untitled Project'}</div>
          <div className="ProjectHeader-description">{project.metadata.description}</div>
        </div>

        <div className="ProjectHeader-actions"></div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    isFocused: state.focus.level === 'project' && !state.focus.forceProject,
  };
}

export default connect(mapStateToProps, {
  inspectorToggleVisibility,
  focusPrioritize,
  uiInlineEditor,
  projectRename,
})(ProjectHeader);

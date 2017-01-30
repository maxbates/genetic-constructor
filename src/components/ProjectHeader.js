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

import { focusPrioritize, focusConstruct } from '../actions/focus';
import { projectRename, projectAddConstruct } from '../actions/projects';
import { blockCreate } from '../actions/blocks';
import { inspectorToggleVisibility, uiInlineEditor } from '../actions/ui';
import Box2D from '../containers/graphics/geometry/box2d';
import InlineToolbar from '../components/toolbars/inline-toolbar';
import '../styles/ProjectHeader.css';
import '../styles/inline-editor.css';

class ProjectHeader extends Component {
  static propTypes = {
    blockCreate: PropTypes.func.isRequired,
    project: PropTypes.object.isRequired,
    isFocused: PropTypes.bool.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
  };

  state = {
    hover: false,
  };

  onClick = () => {
    this.props.inspectorToggleVisibility(true);
    this.props.focusPrioritize('project');
    const name = this.props.project.metadata.name || 'Untitled Project';
    if (!this.props.project.rules.frozen) {
      this.props.uiInlineEditor((value) => {
        this.props.projectRename(this.props.project.id, value);
      }, name, this.titleEditorBounds(), 'inline-editor-project', ReactDOM.findDOMNode(this));
    }
  };

  onMouseEnter = () => {
    this.setState({ hover: true });
  };

  onMouseLeave = () => {
    this.setState({ hover: false });
  };

  /**
   * add new construct to project
   */
  onAddConstruct = () => {
    const block = this.props.blockCreate({ projectId: this.props.project.id });
    this.props.projectAddConstruct(this.props.project.id, block.id, true);
    this.props.focusConstruct(block.id);
  };

  titleEditorBounds() {
    return new Box2D(ReactDOM.findDOMNode(this.refs.title).getBoundingClientRect()).inflate(0, 4);
  }

  /**
   * jsx/js for project toolbar
   * @returns {XML}
   */
  toolbar() {
    return (
      <InlineToolbar
        items={[
          {
            text: 'One',
            imageURL: '/images/ui/add.svg',
            enabled: true,
            clicked: this.onAddConstruct,
          }, {
            text: 'Two',
            imageURL: '/images/ui/view.svg',
            enabled: true,
            clicked: (event) => {},
          }, {
            text: 'Three',
            imageURL: '/images/ui/download.svg',
            enabled: true,
            clicked: (event) => {},
          }, {
            text: 'Four',
            imageURL: '/images/ui/delete.svg',
            enabled: true,
            clicked: (event) => {},
          }, {
            text: 'More...',
            imageURL: '/images/ui/more.svg',
            enabled: true,
            clicked: (event) => {
            },
          }
        ]}
      />);
  }

  render() {
    const { project, isFocused } = this.props;
    let hoverElement;
    if (this.state.hover && !this.props.project.rules.frozen) {
      hoverElement = (
        <div className="inline-editor-hover inline-editor-hover-project">
          <span>{project.metadata.name || 'Untitled Project'}</span>
          <img src="/images/ui/inline_edit.svg" />
        </div>
      );
    }

    return (
      <div
        className={`ProjectHeader${isFocused ? ' focused' : ''}`}
      >
        <div
          className="ProjectHeader-info"
          onClick={this.onClick}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
        >
          <div ref="title" className="ProjectHeader-title">{project.metadata.name || 'Untitled Project'}</div>
          <div className="ProjectHeader-description">{project.metadata.description}</div>
        </div>

        <div className="ProjectHeader-actions">
          {this.toolbar()}
        </div>
        {hoverElement}
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
  blockCreate,
  inspectorToggleVisibility,
  focusPrioritize,
  focusConstruct,
  uiInlineEditor,
  projectAddConstruct,
  projectRename,
})(ProjectHeader);

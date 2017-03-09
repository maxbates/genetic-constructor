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

import { focusConstruct } from '../../../actions/focus';
import { projectRemoveConstruct } from '../../../actions/projects';
import TitleAndToolbar from '../../../components/toolbars/title-and-toolbar';

import '../../../styles/ConstructViewerJob.css';

export class ConstructViewerJob extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    construct: PropTypes.object.isRequired,
    onDelete: PropTypes.func,
    //connect
    isFocused: PropTypes.bool.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    projectRemoveConstruct: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.pollForJob();
  }

  componentDidUpdate(oldProps) {
    if (this.props.construct.jobId !== oldProps.construct.jobId) {
      this.pollForJob();
    }
  }

  onDelete = () => {
    if (this.props.onDelete) {
      this.props.onDelete(this.props.construct.jobId, this.props.projectId, this.props.construct.id);
      return;
    }

    this.props.projectRemoveConstruct(this.props.projectId, this.props.construct.id);
    //todo - end the job
  };

  pollForJob = () => {
    //todo
    const jobId = this.props.construct.jobId;

    console.log(`TODO poll for: ${jobId}`);
  };

  render() {
    return (
      <div
        className={`ConstructViewerJob construct-viewer ${this.props.isFocused ? 'construct-viewer-focused' : ''}`}
        onClick={() => this.props.focusConstruct(this.props.construct.id)}
      >
        <div className="sceneGraphContainer">
          <div className="ConstructViewerJob-text">Working on your optimization request...</div>
        </div>

        <div className="corner" style={{ borderColor: this.props.construct.getColor() }} />
        <div className="title-and-toolbar-container">
          <TitleAndToolbar
            title={this.props.construct.getName('New Construct')}
            color={this.props.construct.getColor()}
            noHover
            toolbarItems={[{
              text: 'Locked',
              imageURL: '/images/ui/lock-locked.svg',
              enabled: false,
            }, {
              text: 'Delete Job',
              imageURL: '/images/ui/delete.svg',
              onClick: this.onDelete,
            }]}
          />
        </div>
      </div>
    );
  }
}

export default connect((state, props) => ({
  isFocused: state.focus.constructId === props.construct.id,
}), {
  focusConstruct,
  projectRemoveConstruct,
})(ConstructViewerJob);

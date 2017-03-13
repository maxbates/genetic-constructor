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
import { uiSetGrunt } from '../../../actions/ui';
import { projectRemoveConstruct } from '../../../actions/projects';
import { jobPoll, jobGet, jobCancel } from '../../../middleware/jobs';
import TitleAndToolbar from '../../../components/toolbars/title-and-toolbar';

import '../../../styles/ConstructViewerJob.css';

export class ConstructViewerJob extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    construct: PropTypes.object.isRequired,
    onDelete: PropTypes.func,
    //connect
    isFocused: PropTypes.bool.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
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
    const { onDelete, construct, projectId, projectRemoveConstruct } = this.props;

    if (onDelete) {
      onDelete(construct.jobId, projectId, construct.id);
    }

    //should we cancel? delete? pause? *** what if they undo? ***
    //no need to wait for it
    //jobCancel(this.props.construct.jobId);

    projectRemoveConstruct(projectId, construct.id);
  };

  onJobComplete = ({ complete, failure, error, job, result }) => {
    if (failure === true) {
      this.props.uiSetGrunt('Your job failed... Sorry!');
      console.log(job); //eslint-disable-line no-console
      console.log(error); //eslint-disable-line no-console
    }

    console.log(result);
    //todo - fetch the result and update, then delete this so stop polling
    //what is the expected result format?
  };

  //first, try to just get the job, then poll if not complete
  pollForJob = () => {
    const { projectId, construct } = this.props;
    const jobId = construct.jobId;

    return jobGet(projectId, jobId)
    .then(retrieved => {
      if (retrieved.failure || retrieved.complete) {
        return this.onJobComplete(retrieved);
      }

      return jobPoll(projectId, jobId).then(this.onJobComplete);
    });
  };

  render() {
    const { isFocused, focusConstruct, construct } = this.props;

    return (
      <div
        className={`ConstructViewerJob construct-viewer ${isFocused ? 'construct-viewer-focused' : ''}`}
        onClick={() => focusConstruct(this.props.construct.id)}
      >
        <div className="sceneGraphContainer">
          <div className="ConstructViewerJob-text">Working on your optimization request...</div>
        </div>

        <div className="corner" style={{ borderColor: construct.getColor() }} />
        <div className="title-and-toolbar-container">
          <TitleAndToolbar
            title={construct.getName('New Construct')}
            color={construct.getColor()}
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
  uiSetGrunt,
  focusConstruct,
  projectRemoveConstruct,
})(ConstructViewerJob);

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
import _ from 'lodash';
import Rollup from '../../../models/Rollup';
import { blockStash, blockAddComponent, blockSetJobId } from '../../../actions/blocks';
import { focusConstruct } from '../../../actions/focus';
import { uiSetGrunt } from '../../../actions/ui';
import { projectAddConstruct, projectRemoveConstruct } from '../../../actions/projects';
import { jobPoll, jobGet, jobGetResult } from '../../../middleware/jobs';
import TitleAndToolbar from '../../../components/toolbars/title-and-toolbar';

import '../../../styles/ConstructViewerJob.css';

export class ConstructViewerJob extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    construct: PropTypes.object.isRequired,
    onDelete: PropTypes.func,
    //connect
    isFocused: PropTypes.bool.isRequired,
    blockStash: PropTypes.func.isRequired,
    blockAddComponent: PropTypes.func.isRequired,
    blockSetJobId: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    projectRemoveConstruct: PropTypes.func.isRequired,
  };

  state = {
    failure: false,
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

    this.cancelPolling();

    projectRemoveConstruct(projectId, construct.id);
  };

  onJobComplete = (jobObj) => {
    const { construct } = this.props;
    const { projectId, jobId } = construct;
    const { failure, error, job } = jobObj;

    this.cancelPolling();

    if (failure === true) {
      console.log('Job Failed');
      console.log(job); //eslint-disable-line no-console
      console.log(error); //eslint-disable-line no-console

      return this.onFailure();
    }

    //job is done, get the result in s3
    jobGetResult(projectId, jobId)
    .then(result => {
      // ? rollup utility to handle this merging, share with import middleware?
      // difficult to handle in one place the differences between client and server
      // wait until try to handle genbank and handle similarly

      //assume we got a rollup, and update project accordingly
      if (result && result.blocks && result.project) {
        const rollup = Rollup.classify(result);
        const { project, blocks } = rollup;

        //handle the empty construct scenario
        //todo - this is somewhat blast specific, should return a more specific message
        if (!project.components.length) {
          this.onFailure('No matches were found');
          return;
        }

        //assign information from this construct to the new constructs (maintain inheritance, etc.)
        const toMerge = _.cloneDeep(construct);
        delete toMerge.jobId; //remove the job ID
        delete toMerge.id; //remove ID to handle more than one result

        const constructs = _.mapValues(rollup.getBlocks(...project.components), block => block.merge(toMerge));

        //add the updated constructs to the rollup
        Object.assign(blocks, constructs);

        //store all the blocks
        this.props.blockStash(..._.values(blocks));

        //hack kinda - insert all the results in the construct, not as constructs
        //we have weird wrapping where constructs aren't allowed to be lists etc.
        //add each construct in the rollup, merging with this job construct (to keep inheritance etc.)
        _.forEach(constructs, (block, constructId) => {
          this.props.blockAddComponent(construct.id, constructId);
        });
      }

      this.props.blockSetJobId(construct.id, null);
    });
  };

  onFailure = (failureMessage = 'Your job could not be completed. Try again in a few minutes.') => {
    const name = this.props.construct.getName();
    this.props.uiSetGrunt(`${name}: ${failureMessage}`, -1);
  };

  //first, try to just get the job, then poll if not complete
  pollForJob = () => {
    const { construct } = this.props;
    const { projectId, jobId } = construct;

    //stop any old polling
    this.cancelPolling();

    return jobGet(projectId, jobId)
    .then((retrieved) => {
      if (retrieved.failure || retrieved.complete) {
        return this.onJobComplete(retrieved);
      }

      this.poller = jobPoll(projectId, jobId).then(this.onJobComplete);
    })
    .catch((err) => {
      //swallow - the job didn't exist, and we aren't polling
    });
  };

  cancelPolling() {
    //stop polling for the job
    if (this.poller && this.poller.cancelPoll) {
      this.poller.cancelPoll();
    }
  }

  render() {
    const { isFocused, focusConstruct, construct } = this.props;

    return (
      <div
        className={`ConstructViewerJob construct-viewer${isFocused ? ' construct-viewer-focused' : ''}`}
        onClick={() => focusConstruct(this.props.construct.id)}
      >
        <div className="sceneGraphContainer">
          <div className="ConstructViewerJob-text">
            Working on your optimization request...
          </div>
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
  blockStash,
  blockAddComponent,
  blockSetJobId,
  uiSetGrunt,
  focusConstruct,
  projectAddConstruct,
  projectRemoveConstruct,
})(ConstructViewerJob);

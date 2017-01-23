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

import { blockCreate } from '../../actions/blocks';
import { focusConstruct } from '../../actions/focus';
import { projectAddConstruct, projectCreate, projectOpen, projectSave } from '../../actions/projects';
import { uiShowGenBankImport } from '../../actions/ui';
import * as instanceMap from '../../store/instanceMap';
import '../../styles/InventoryProjectHeader.css';

class InventoryProjectHeader extends Component {
  static propTypes = {
    blockCreate: PropTypes.func.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    uiShowGenBankImport: PropTypes.func.isRequired,
    currentProjectId: PropTypes.string.isRequired,
    dragInside: PropTypes.bool,
  };

  onAddNewProject = () => {
    // create project and add a default construct
    const project = this.props.projectCreate();
    // add a construct to the new project
    const block = this.props.blockCreate({ projectId: project.id });
    const projectWithConstruct = this.props.projectAddConstruct(project.id, block.id, true);

    //save this to the instanceMap as cached version, so that when projectSave(), will skip until the user has actually made changes
    //do this outside the actions because we do some mutations after the project + construct are created (i.e., add the construct)
    instanceMap.saveRollup({
      project: projectWithConstruct,
      blocks: {
        [block.id]: block,
      },
    });

    this.props.focusConstruct(block.id);
    this.props.projectOpen(project.id);
  };

  /**
   * start upload of genbank
   */
  onUpload = () => {
    this.props.projectSave(this.props.currentProjectId)
    .then(() => {
      this.props.uiShowGenBankImport(true);
    });
  };

  render() {
    return (
      <div className="InventoryProjectHeader">
        <div className={`imgWrapper ${this.props.dragInside ? 'highlight' : ''}`}>
          <img
            className={this.props.dragInside ? 'highlight' : ''}
            data-testid="NewProjectButton"
            src="/images/ui/add.svg"
            title="Add New Project"
            onClick={this.onAddNewProject}
          />
        </div>
        <div className="imgWrapper">
          <img
            data-testid="UploadButton"
            src="/images/ui/upload.svg"
            title="Upload Genbank or CSV File"
            onClick={this.onUpload}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { projects, blocks } = state;

  return {
    projects,
    blocks,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  projectCreate,
  projectOpen,
  projectSave,
  projectAddConstruct,
  focusConstruct,
  uiShowGenBankImport,
})(InventoryProjectHeader);

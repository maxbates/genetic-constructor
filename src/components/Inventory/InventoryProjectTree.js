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
import { blockStash } from '../../actions/blocks';
import InventorySearch from './InventorySearch';
import { projectList, projectLoad, projectSave, projectOpen } from '../../actions/projects';
import * as instanceMap from '../../store/instanceMap';
import Spinner from '../ui/Spinner';
import Tree from '../ui/Tree';

export class InventoryProjectTree extends Component {
  static propTypes = {
    currentProject: PropTypes.string,
    projects: PropTypes.object.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    templates: PropTypes.bool.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectGet: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
  };

  state = {
    isLoading: true,
    filter: InventoryProjectTree.filter || '',
  };

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
    .then(() => this.setState({ isLoading: false }));
  }

  static filter = '';

  handleFilterChange = (filter) => {
    InventoryProjectTree.filter = filter;
    this.setState({ filter });
  };

  /**
   * when a project is expanded
   * @param projectId
   */
  onExpandProject(project, item) {
    debugger;
    this.props.projectLoad(project.id)
      .then(() => {
        this.props.projectOpen(project.id)
          .then(() => {
            const c = project.components;
            console.log(c);
            console.log(item.text);
            // update the tree here.
          });
      });
  }

  /**
   * build a nested set of tree items from the given components array
   * @param components
   */
  getProjectBlocksRecursive(components) {
    const items = [];
    (components || []).forEach(blockId => {
      const block = this.props.blocks[blockId] || instanceMap.getBlock(blockId);
      if (block) {
        items.push({
          block,
          text: block.getName(),
          items: this.getProjectBlocksRecursive(block.components),
        })
      }
    });
    return items;
  }

  render() {
    const { projects, currentProject } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }
    // filter on isSample to separate templates from projects and also match to the current search filter
    const filtered = {};
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];
      if (this.props.templates === !!project.isSample) {
        const name = project.metadata.name ? project.metadata.name.toLowerCase() : '';
        const filter = this.state.filter.toLowerCase();
        if (name.indexOf(filter) >= 0) {
          filtered[projectId] = projects[projectId];
        }
      }
    });

    // map projects to items for use in a tree
    const treeItems = Object.keys(filtered)
    .map(projectId => filtered[projectId])
    .sort((one, two) => two.metadata.created - one.metadata.created)
    .map(project => {
      const projectId = project.id;
      const isActive = (projectId === currentProject);

      // return (
      //   <InventoryProject key={projectId}
      //                     project={project}
      //                     isActive={isActive}/>
      // );


      return {
        text: project.getName(),
        onExpand: this.onExpandProject.bind(this, project),
        items: this.getProjectBlocksRecursive(project.components),
      }
    });

    return (
      <div>
        <InventorySearch searchTerm={this.state.filter}
                         disabled={false}
                         placeholder="Filter projects"
                         onSearchChange={this.handleFilterChange}/>
        <div className="InventoryProjectList">
          <Tree items={treeItems} />
        </div>
      </div>);
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
  blockStash,
  projectList,
  projectLoad,
  projectSave,
  projectOpen,
})(InventoryProjectTree);

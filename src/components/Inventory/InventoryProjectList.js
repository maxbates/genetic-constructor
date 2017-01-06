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
import { projectList } from '../../actions/projects';
import { blockStash } from '../../actions/blocks';
import InventorySearch from './InventorySearch';
import InventoryProject from './InventoryProject';
import Spinner from '../ui/Spinner';


export class InventoryProjectList extends Component {
  static propTypes = {
    currentProject: PropTypes.string,
    projects: PropTypes.object.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    templates: PropTypes.bool.isRequired,
  };

  state = {
    isLoading: true,
    filter: InventoryProjectList.filter || '',
  };

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
      .then(() => this.setState({ isLoading: false }));
  }

  static filter = '';

  handleFilterChange = (filter) => {
    InventoryProjectList.filter = filter;
    this.setState({filter});
  };

  render() {
    const { projects, currentProject } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }
    // filter on isSample to separate templates from projects and also match
    // to the current search filter
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

    return (
      <div>
        <InventorySearch searchTerm={this.state.filter}
                         disabled={false}
                         placeholder="Search"
                         onSearchChange={this.handleFilterChange}/>
        <div className="InventoryProjectList">

          {Object.keys(filtered)
            .map(projectId => filtered[projectId])
            .sort((one, two) => two.metadata.created - one.metadata.created)
            .map(project => {
              const projectId = project.id;
              const isActive = (projectId === currentProject);

              return (
                <InventoryProject key={projectId}
                                  project={project}
                                  isActive={isActive}/>
              );
            })}
        </div>
      </div>);
  }
}

function mapStateToProps(state, props) {
  const { projects } = state;

  return {
    projects,
  };
}

export default connect(mapStateToProps, {
  blockStash,
  projectList,
})(InventoryProjectList);

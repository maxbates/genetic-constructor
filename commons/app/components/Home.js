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

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import _ from 'lodash';

import ProjectCard from './ProjectCard';
import { sanitize } from '../sanitize';

if (process.env.BROWSER) {
  require('../styles/Home.css'); //eslint-disable-line global-require
}

export function Home({ location, router, projects, snapshots }) {
  if (location.query.projectId) {
    const project = projects[location.query.projectId];
    const name = sanitize(project && project.project.metadata.name);
    router.replace(`/commons/${name}?projectId=${location.query.projectId}`);
    return null;
  }

  const projectKeys = Object.keys(projects);
  const numberProjects = projectKeys.length;
  const numberConstructs = projectKeys.reduce((acc, key) => acc + projects[key].project.components.length, 0);
  const basePairs = _.reduce(snapshots, (count, snapshot) => count + (snapshot.tags.basePairs || 0), 0);

  return (
    <div className="Home">
      <div className="Home-splash">
        <h1 className="Home-splash-heading">The Commons</h1>
        <h4 className="Home-splash-subheading">
          A library of reusable designs created and shared by the Genetic Constructor community.
        </h4>
      </div>

      <summary className="Home-stats">
        <span className="Home-stats-stat">{numberProjects} Projects</span>
        <span className="Home-stats-stat">{numberConstructs} Constructs</span>
        <span className="Home-stats-stat">{basePairs} Base Pairs</span>
      </summary>

      <div className="Home-projects">
        {Object.keys(projects).sort().map(projectId => (
          <ProjectCard
            key={projectId}
            project={projects[projectId]}
          />
        ))}
      </div>
    </div>
  );
}

Home.propTypes = {
  projects: PropTypes.object.isRequired,
  snapshots: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
};

export default connect(state => ({
  projects: state.projects,
  snapshots: state.snapshots,
}))(withRouter(Home));

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
import { Link, withRouter } from 'react-router';
import moment from 'moment';

import Rollup from '../../../src/models/Rollup';

import InfoTable from './InfoTable';
import ConstructAbout from './ConstructAbout';
import BigOpenLink from './BigOpenLink';

if (process.env.BROWSER) {
  require('../styles/Project.css'); //eslint-disable-line global-require
}

export function Project({ router, project, snapshot }) {
  if (!project || !snapshot) {
    //todo - load projects on re-direct on client (or make sure router is loading)
    //router.replace('/commons/');
    return null;
  }

  const openLink = `/project/${project.project.id}`;

  //NB - if rendering multiple times, should only create Rollup if needed
  //create a rollup for all the components on this page + nested
  const rollup = Rollup.classify(project);

  const numberConstructs = project.project.components.length;
  const numberBlocks = Object.keys(project.blocks).length - numberConstructs;
  const numberBases = Object.keys(project.blocks).reduce((acc, blockId) => acc + (project.blocks[blockId].sequence.length || 0), 0);

  return (
    <div className="Project">
      <h3 className="Project-header">
        <Link to="/commons">The Commons</Link>
        <span className="Project-header-separator" />
        {project.project.metadata.name}
      </h3>

      <summary className="Project-overview">
        <InfoTable
          values={[
            ['Project', project.project.metadata.name, { bold: true }],
            ['Description', project.project.metadata.description],
            ['Keywords', snapshot.keywords],
            ['Publisher', snapshot.tags.author],
            ['Updated', moment(snapshot.updated).format('LL')],
          ]}
        />
        <BigOpenLink href={openLink} />
      </summary>

      <main className="Project-preview">
        <h3 className="Project-preview-title">Project Preview</h3>
        <div className="Project-preview-stats">
          <div className="Project-preview-stats-stat">{`${numberConstructs} Construct${(numberConstructs > 1) ? 's' : ''}`}</div>
          <div className="Project-preview-stats-stat">{numberBlocks} Blocks</div>
          <div className="Project-preview-stats-stat">{numberBases} Base pairs</div>
        </div>
        <div className="Project-constructs">
          {project.project.components.map(constructId => (
            <ConstructAbout
              key={constructId}
              constructId={constructId}
              project={rollup}
            />
          ))}
        </div>
      </main>

      {project.project.components.length > 3 && (
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
          <BigOpenLink href={openLink} />
        </div>
      )}

      <aside className="Project-license">
        <h3>License</h3>
        <div className="Project-textblock">
          This project is made available license-free in the public domain under the&nbsp;
          <a href="" target="_blank" rel="noopener noreferrer">Creative Commons CCØ</a> license.&nbsp;
          <a href="" target="_blank" rel="noopener noreferrer">Learn more…</a>
        </div>
      </aside>

      <aside className="Project-what">
        <h3>What is this?</h3>
        <div className="Project-textblock">
          Genetic Constructor is a web application for biologists working in protein engineering and synthetic biology. The Commons is a public repository of Genetic Constructor projects (like the one shown on this page) that everyone can publish and reuse — directly from within the app. To explore this project in Genetic Constructor click <a href={openLink} target="_blank" rel="noopener noreferrer">OPEN IN GENETIC CONSTRUCTOR</a>, then sign in or create a free account.
        </div>
      </aside>
    </div>
  );
}

Project.propTypes = {
  params: PropTypes.shape({ //eslint-disable-line react/no-unused-prop-types
    projectQuery: PropTypes.string,
  }).isRequired,
  location: PropTypes.shape({ //eslint-disable-line react/no-unused-prop-types
    query: PropTypes.shape({
      projectId: PropTypes.string,
    }).isRequired,
  }).isRequired,
  project: PropTypes.object.isRequired,
  snapshot: PropTypes.object.isRequired,
};

export default withRouter(connect((state, props) => {
  const projectId = props.location.query.projectId || ''; //todo

  return {
    project: state.projects[projectId],
    snapshot: state.snapshots.find(snapshot => snapshot.projectId === projectId),
  };
})(Project));

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
import { Link } from 'react-router';

import InfoTable from './InfoTable';
import ConstructAbout from './ConstructAbout';
import BigOpenLink from './BigOpenLink';

export function Project({ project, snapshot }) {
  const openLink = `/project/${project.project.id}`;

  const numberBlocks = Object.keys(project.blocks).length;
  const numberBases = Object.keys(project.blocks).reduce((acc, blockId) => acc + (project.blocks[blockId].sequence.length || 0), 0);

  return (
    <div className="Project">
      <h3 className="Project-header">
        <Link to="/">The Commons</Link> &gt; {project.project.metadata.name}
      </h3>

      <div className="Project-overview">
        <InfoTable
          values={[
            ['Project', project.project.metadata.name, { bold: true }],
            ['Description', project.project.metadata.description],
            ['Keywords', project.project.metadata.keywords],
            ['Publisher', 'TODO'],
            ['Updated', 'TODO'],
          ]}
          style={{ width: '500px' }}
        />
        <BigOpenLink href={openLink} />
      </div>

      <div className="Project-preview">
        <h3 className="Project-preview-title">Project Preview</h3>
        <div className="Project-preview-stats">
          <div className="Project-preview-stats-stat">{project.project.components.length} Constructs</div>
          <div className="Project-preview-stats-stat">{numberBlocks} Blocks</div>
          <div className="Project-preview-stats-stat">{numberBases} Base pairs</div>
        </div>
        <div className="Project-constructs">
          {project.project.components.map(constructId => (
            <ConstructAbout
              key={constructId}
              constructId={constructId}
              project={project}
            />
          ))}
        </div>
      </div>

      <div className="Project-license">
        This project is made available license-free in the public domain under the&nbsp;
        <a href="" target="_blank" rel="noopener noreferrer">Creative Commons CCØ</a> license.&nbsp;
        <a href="" target="_blank" rel="noopener noreferrer">Learn more…</a>
      </div>

      <div className="Project-what">
        Genetic Constructor is a web application for biologists working in protein engineering and synthetic biology.
        The Commons is a public repository of Genetic Constructor projects (like the one shown on this page) that
        everyone can publish and reuse — directly from within the app. To explore this project in Genetic Constructor
        click OPEN IN GENETIC CONSTRUCTOR, then sign in or create a free account.
      </div>
    </div>
  );
}

Project.propTypes = {
  params: PropTypes.shape({
    projectId: PropTypes.string.isRequired,
  }).isRequired,
  project: PropTypes.object.isRequired,
  snapshot: PropTypes.object.isRequired,
};

export default connect((state, props) => ({
  project: state.projects[props.params.projectId],
  snapshot: state.snapshots.find(snapshot => snapshot.projectId === props.params.projectId),
}))(Project);

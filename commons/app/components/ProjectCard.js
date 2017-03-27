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
import { Link } from 'react-router';

import { getPalette } from '../../../src/utils/color/index';

import '../styles/ProjectCard.css';

export default function ProjectCard({ project }) {
  const firstConstruct = project.blocks[project.project.components[0]];
  const paletteName = firstConstruct.metadata.palette || project.project.metadata.palette;
  const palette = getPalette(paletteName);
  const colorIndex = firstConstruct.metadata.color || 0;
  const color = palette[colorIndex].hex;

  return (
    <div className="ProjectCard">
      <div className="ProjectCard-corner" style={{ borderTopColor: color, borderLeftColor: color }} />
      <div className="ProjectCard-metadata">
        <Link to={`/${project.project.id}`}>
          <div className="ProjectCard-name" style={{ color }}>
            {project.project.metadata.name}
          </div>
          <div className="ProjectCard-description">
            {project.project.metadata.description}
          </div>
        </Link>
      </div>
    </div>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    project: PropTypes.shape({
      id: PropTypes.string.isRequired,
      metadata: PropTypes.object.isRequired,
    }).isRequired,
    blocks: PropTypes.object.isRequired,
  }).isRequired,
};

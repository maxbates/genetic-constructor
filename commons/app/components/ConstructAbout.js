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

import InfoTable from './InfoTable';
import ConstructRadial from './ConstructRadial';

if (process.env.BROWSER) {
  require('../styles/ConstructAbout.css'); //eslint-disable-line global-require
}

export default function ConstructAbout({ constructId, project }) {
  const construct = project.getBlock(constructId);
  const { components, options } = project.getContents(constructId);
  const contents = { ...components, ...options };

  const annotations = Object.keys(contents).reduce((acc, blockId) => {
    return acc.concat(project.blocks[blockId].sequence.annotations.map(ann => ann.name));
  }, []);

  return (
    <div className="ConstructAbout">
      <ConstructRadial
        constructId={constructId}
        project={project}
      />

      <div className="ConstructAbout-metadata">
        <h3 className="ConstructAbout-name">{construct.metadata.name}</h3>
        <InfoTable
          values={[
            ['Description', construct.metadata.description],
            ['Attribution', construct.attribution.map(attr => attr.text)],
            ['Organism', construct.notes.Organism],
            ['Molecule', 'DNA'],
            ['Annotations', annotations],
          ]}
        />
      </div>
    </div>
  );
}

ConstructAbout.propTypes = {
  constructId: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired,
};


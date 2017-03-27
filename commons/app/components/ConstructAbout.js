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
import React from 'react';

import InfoTable from './InfoTable';

import '../styles/ConstructAbout.css';

export default function ConstructAbout({ constructId, project }) {
  const construct = project.blocks[constructId];

  //todo - get all annotations, including nested
  const annotations = [];

  return (
    <div className="ConstructAbout">
      <div className="ConstructAbout-glyph">todo</div>
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

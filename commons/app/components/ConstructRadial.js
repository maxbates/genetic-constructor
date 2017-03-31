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
import * as d3Shape from 'd3-shape';
import * as d3Hierarchy from 'd3-hierarchy';

import { getPalette, colorFiller } from '../../../src/utils/color/index';

export default class ConstructRadial extends Component {
  static propTypes = {
    constructId: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
  };

  static createLeaf(node) {
    return Object.assign(node, {
      size: node.sequence.length || 0,
    });
  }

  //creates tree with blocks (not ids) in tree
  //NB - pass in cloned root
  static createTree(rootBlock, project) {
    if (!rootBlock.components.length) {
      return ConstructRadial.createLeaf(rootBlock);
    }

    return Object.assign(rootBlock, {
      children: rootBlock.components.map((componentId) => {
        const component = project.getBlock(componentId);
        const copied = Object.assign({}, component, {
          parent: rootBlock,
        });

        return ConstructRadial.createTree(copied, project);
      }),
    });
  }

  static getColor(index, paletteName) {
    const palette = getPalette(paletteName);
    return (Number.isInteger(index) && palette[index]) ? palette[index].hex : colorFiller;
  }

  constructor(props) {
    super(props);

    //width / height
    this.dimension = 200;

    //todo - make hollow ring for construct(adjust attr display in render)

    this.arc = d3Shape.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => Math.sqrt(d.y0))
    .outerRadius(d => Math.sqrt(d.y1));

    this.calculateStuff(props);
  }

  componentWillReceiveProps(nextProps) {
    this.calculateStuff(nextProps);
  }

  calculateStuff(forceProps) {
    const props = forceProps || this.props;

    const { constructId, project } = props;

    //should only compute this when props change...
    //generate tree data structure we want
    const rootClone = Object.assign({}, project.getBlock(constructId));
    const tree = ConstructRadial.createTree(rootClone, project);

    const partition = d3Hierarchy.partition(tree)
    .size([2 * Math.PI, this.dimension * this.dimension / 4]);

    const root = d3Hierarchy.hierarchy(tree)
    .sum(d => d.size);

    this.nodes = partition(root).descendants();
    // For efficiency, filter nodes to keep only those large enough to see.0.005 radians = 0.29 degrees
    //.filter(d => d.x1 - d.x0 > 0.005);
  }

  render() {
    const { constructId, project } = this.props;

    //todo - only calc when needed
    this.calculateStuff();

    const construct = project.getBlock(constructId);
    const paletteName = construct.metadata.palette || project.project.metadata.palette;

    const dim = this.dimension;

    //todo - account for when no basepairs in entire project

    return (
      <figure style={{ width: `${dim}px`, height: `${dim}px` }}>
        <svg width={dim} height={dim}>
          <g transform={`translate(${dim / 2},${dim / 2})`}>
            {this.nodes.map(d => (
              <path
                key={d.data.id}
                display={(d.depth > 0 || d.value === 0) ? null : 'none'}
                d={this.arc(d)}
                style={{
                  fill: ConstructRadial.getColor(d.data.metadata.color, paletteName),
                  stroke: 'transparent',
                  opacity: 1,
                  strokeWidth: '3px',
                }}
              >
                <title>{`${d.data.metadata.name || 'Untitled Block'} - ${d.value} bp`}</title>
              </path>
            ))}
          </g>
        </svg>
      </figure>
    );
  }
}

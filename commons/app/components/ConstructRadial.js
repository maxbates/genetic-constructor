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
import * as d3 from 'd3'; //todo - pare down to libs needed

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

        Object.assign(component, {
          parent: rootBlock,
        });

        return ConstructRadial.createTree(component, project);
      }),
    });
  }

  static getColor(index, paletteName) {
    const palette = getPalette(paletteName);
    return (Number.isInteger(index) && palette[index]) ? palette[index].hex : colorFiller;
  }

  //todo - server friendly, should render SVG on server
  componentDidMount() {
    this.drawSunburst();
  }

  drawSunburst = () => {
    const { constructId, project } = this.props;

    const construct = project.getBlock(constructId);
    const paletteName = construct.metadata.palette || project.project.metadata.palette;

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    //generate tree data structure we want
    const tree = ConstructRadial.createTree({ ...project.getBlock(constructId) }, project);

    const partition = d3.partition(tree)
    .size([2 * Math.PI, radius * radius]);

    const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => Math.sqrt(d.y0))
    .outerRadius(d => Math.sqrt(d.y1));

    const root = d3.hierarchy(tree)
    .sum(d => d.size);

    const nodes = partition(root).descendants();
    // For efficiency, filter nodes to keep only those large enough to see.0.005 radians = 0.29 degrees
    //.filter(d => d.x1 - d.x0 > 0.005);

    const path = d3.select(this.svg)
    .data([tree])
    .selectAll('path')
    .data(nodes);

    path.enter()
    .append('svg:path')
    .attr('display', d => d.depth > 0 ? null : 'none') //hide root node //todo - make hollow ring
    .attr('d', arc)
    .style('fill', d => ConstructRadial.getColor(d.data.metadata.color, paletteName))
    .style('stroke', 'transparent')
    .style('opacity', 1)
    .style('strokeWidth', '3px')
    .append('svg:title')
    .text(d => `${d.data.metadata.name || 'Untitled Block'} - ${d.value} bp`);
  };

  render() {
    return (
      <div style={{ width: '200px', height: '200px' }}>
        <svg width="200" height="200">
          <g ref={(el) => { this.svg = el; }} transform="translate(100,100)" />
        </svg>
      </div>
    );
  }
}

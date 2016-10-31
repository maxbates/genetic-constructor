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
import '../styles/InventorySectionIcon.css';


// map section names to SVG URI
const sectionNameToSVG = {
  templates: '/images/ui/inventory_templates.svg',
  sketch : '/images/ui/inventory_sketch.svg',
  commons : '/images/ui/inventory_commons.svg',
  projects: '/images/ui/inventory_projects.svg',
  ncbi: '/images/ui/inventory_search_plugin_ncbi.svg',
  igem: '/images/ui/inventory_search_plugin_igem.svg',
  egf: '/images/ui/inventory_search_plugin_egf.svg',
};

export default class InventorySectionIcon extends Component {
  static propTypes = {
    section: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired,
  };

  render() {
    const imgClass = this.props.open ? 'open' : '';
    return (
      <div className="InventorySectionIcon">
        <img className={imgClass} src={sectionNameToSVG[this.props.section]}/>
      </div>
    );
  }
}
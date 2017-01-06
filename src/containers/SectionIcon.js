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
import '../styles/SectionIcon.css';


// map section names to SVG URI
const sectionNameToSVG = {
  // inventory icons
  Templates: '/images/ui/inventory_templates.svg',
  Sketch: '/images/ui/inventory_sketch.svg',
  Commons: '/images/ui/inventory_commons.svg',
  Projects: '/images/ui/inventory_projects.svg',
  Ncbi: '/images/ui/inventory_search_plugin_ncbi.svg',
  Igem: '/images/ui/inventory_search_plugin_igem.svg',
  Egf: '/images/ui/inventory_search_plugin_egf.svg',
  // inspector icons
  Information: '/images/ui/inspector_information.svg',
  Settings: '/images/ui/inspector_settings.svg',
  Extensions: '/images/ui/inspector_plugins.svg',
  Help: '/images/ui/inspector_help.svg',
  Orders: '/images/ui/inspector_orders.svg',
  History: '/images/ui/inspector_history.svg',
  Feedback: '/images/ui/inspector_feedback.svg',
};

export default class SectionIcon extends Component {
  static propTypes = {
    section: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
  };

  state = {
    hover: false,
  };

  /**
   * a click either selects the section if unselected or toggle the parent
   * if already selected
   * @param event
   */
  onClick = (event) => {
    event.stopPropagation();
    if (this.props.open) {
      // when open clicking the selected tab collapses.
      if (this.props.selected) {
        this.props.onToggle(false);
      } else {
        this.props.onSelect(this.props.section);
      }
    } else {
      // when closed always select section and open
      this.props.onSelect(this.props.section);
      this.props.onToggle(true);
    }
  };

  onEnter = () => {
    this.setState({hover: true});
  };
  onLeave = () => {
    this.setState({hover: false});
  };

  render() {
    const highlight = this.props.selected || this.state.hover;
    const containerClass = highlight ? 'SectionIcon Highlighted' : 'SectionIcon';
    return (
      <div
        data-section={this.props.section}
        className={containerClass}
        onMouseEnter={this.onEnter}
        onMouseLeave={this.onLeave}
        data-selected={this.props.selected}
        onClick={this.onClick}>
        <img title={this.props.section} src={sectionNameToSVG[this.props.section]}/>
      </div>
    );
  }
}

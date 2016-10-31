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
import { connect } from 'react-redux';
import { inventoryToggleVisibility, inventorySelectTab } from '../actions/ui';
import InventorySectionIcon from './InventorySectionIcon';

import InventorySideGroup from '../components/Inventory/InventorySideGroup';
import InventoryGroup from '../components/Inventory/InventoryGroup';

import '../styles/Inventory.css';
import '../styles/SidePanel.css';

export class Inventory extends Component {
  static propTypes = {
    projectId: PropTypes.string,
    isVisible: PropTypes.bool.isRequired,
    currentTab: PropTypes.string,
    inventoryToggleVisibility: PropTypes.func.isRequired,
    inventorySelectTab: PropTypes.func.isRequired,
  };

  state = {
    gslActive: false,
  };

  constructor(props) {
    super(props);

    this.sections = [
      {
        title: 'Projects',
        type: 'projects',
        icon: 'src',
        actions: [],
      },
      /*
       //templates will be in the future, will require bunch of work on the backend to handle cloning appropriately, hosting separate from user
       {
       title: 'Templates',
       type: 'template',
       icon: 'src',
       },
       */
      {
        title: 'Sketch',
        type: 'role',
        icon: 'src',
      },
      /*
       //public are will be coming in the future
       {
       title: 'Public',
       type: 'public', //does not exist
       icon: 'src',
       },
       */
      //todo - break this up multiple sections, one for each search source, and update InventoryGroupSearchType
      {
        title: 'Search',
        type: 'search',
        icon: 'src',
      },
      {
        title: 'GSL Library',
        condition: () => this.state.gslActive,
        type: 'gsl',
        icon: 'src',
      },
    ];
  }


  toggle = (forceVal) => {
    this.props.inventoryToggleVisibility(forceVal);
  };

  setActive = (group) => {
    //todo - reset search term, unless switching between two search groups
    this.props.inventorySelectTab(group);
  };

  render() {
    //may be better way to pass in projectId
    const { isVisible, projectId, currentTab } = this.props;
    // classes for content area
    const contentClasses = `content${isVisible ? '' : ' content-closed'}`;
    // classes for vertical menu
    const menuClasses = `vertical-menu${isVisible ? ' open' : ''}`;
    // classes for icons
    const iconClasses = isVisible ? 'open' : '';
    
    const currentSection = this.sections.find(section => section.title === currentTab) || this.sections[0];
    const { title, type, icon, condition, actions, sectionProps } = currentSection;

    return (
      <div className={'SidePanel Inventory' + (isVisible ? ' visible' : '')}
        onClick={() => {
          this.toggle(!isVisible);
        }}
      >
        <div className="container">
          <div className={menuClasses}>
            <InventorySectionIcon open={isVisible} section="templates"/>
            <InventorySectionIcon open={isVisible} section="sketch"/>
            <InventorySectionIcon open={isVisible} section="commons"/>
            <InventorySectionIcon open={isVisible} section="projects"/>
            <InventorySectionIcon open={isVisible} section="ncbi"/>
            <InventorySectionIcon open={isVisible} section="igem"/>
            <InventorySectionIcon open={isVisible} section="egf"/>
          </div>
          <div className={contentClasses}>
            <ul>
              <li>Duncan</li>
              <li>Anthony</li>
              <li>Meech</li>
              <li>Sr</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { isVisible, currentTab } = state.ui.inventory;

  return {
    isVisible,
    currentTab,
  };
}

export default connect(mapStateToProps, {
  inventoryToggleVisibility,
  inventorySelectTab,
})(Inventory);

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
import InventorySideGroup from '../components/Inventory/InventorySideGroup';
import InventoryGroup from '../components/Inventory/InventoryGroup';
import { onRegister, extensionIsActive } from '../extensions/clientRegistry';

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

  componentDidMount() {
    //hack - listen for GSL editor to show its inventory section
    //listen to get relevant manifests here.
    //run on first time (key === null) in case registry is already populated.
    this.extensionsListener = onRegister((registry, key, regions) => {
      if (key === null || key === 'gslEditor') {
        this.setState({ gslActive: extensionIsActive('gslEditor') });
      }
    });
  }

  componentWillUnmount() {
    this.extensionsListener();
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

    const currentSection = this.sections.find(section => section.title === currentTab);
    const { title, type, icon, condition, actions, sectionProps } = currentSection;

    return (
      <div className={'SidePanel Inventory' +
      (isVisible ? ' visible' : '')}>
        <div className="SidePanel-heading">
          <span className="SidePanel-heading-trigger Inventory-trigger"
                onClick={() => this.toggle()}/>
          <div className="SidePanel-heading-content">
            <span className="SidePanel-heading-title">Inventory</span>
            <a className="SidePanel-heading-close"
               ref="close"
               onClick={() => this.toggle(false)}/>
          </div>
        </div>

        <div className="SidePanel-content no-vertical-scroll">
          <div className="Inventory-sidebar">
            {this.sections.map(section => {
              const { title, type, icon, condition, ...rest } = section;
              if (condition && !condition()) {
                return null;
              }

              //todo - need to coordinate drop target + active class across side component + group component
              return (
                <InventorySideGroup title={title}
                                    key={title}
                                    type={type}
                                    icon={icon}
                                    currentProject={projectId}
                                    isActive={currentTab === title}
                                    setActive={() => this.setActive(title)}
                                    {...rest} />
              );
            })}
          </div>

          <div className="Inventory-main">
            <InventoryGroup title={currentSection.title}
                            type={currentSection.type}
                            actions={actions}
                            currentProject={projectId}
                            {...sectionProps} />
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

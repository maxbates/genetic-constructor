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

import '../../styles/InventoryGroup.css';
import InventoryGroupBlocks from './InventoryGroupBlocks';
import InventoryGroupProjects from './InventoryGroupProjects';
import InventoryGroupRole from './InventoryGroupRole';
import InventoryGroupSearch from './InventoryGroupSearch';
import InventoryProjectHeader from './InventoryProjectHeader';

export default class InventoryGroup extends Component {
  static propTypes = {
    actions: PropTypes.array,
    tabInfo: PropTypes.shape({
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    currentProjectId: PropTypes.string,
  };

  /**
   * returns the current component
   */
  inventoryGroupTypeToHeaderComponent = (type, props) => {
    switch (type) {
      case 'projects':
        return (<InventoryProjectHeader {...props} templates={false} />);//eslint-disable-line react/jsx-boolean-value
      case 'templates':
        return (<InventoryProjectHeader {...props} templates={true} />);//eslint-disable-line react/jsx-boolean-value

      default:
        return null;
    }
  };

  /**
   * return component for header area
   */
  inventoryGroupTypeToComponent = (type, props) => {
    switch (type) {
      case 'role' :
        return (<InventoryGroupRole {...props} />);
      case 'search-ncbi' :
        return (<InventoryGroupSearch source="ncbi" {...props} />);
      case 'search-igem' :
        return (<InventoryGroupSearch source="igem" {...props} />);
      case 'search-egf' :
        return (<InventoryGroupSearch source="egf" {...props} />);
      case 'projects':
        return (<InventoryGroupProjects {...props} templates={false} />);//eslint-disable-line react/jsx-boolean-value
      case 'templates':
        return (<InventoryGroupProjects {...props} templates={true} />);//eslint-disable-line react/jsx-boolean-value
      case 'block':
        return (<InventoryGroupBlocks {...props} />);
      default:
        throw new Error(`Type ${type} is not registered in InventoryGroup`);
    }
  };

  render() {
    const { ...rest } = this.props;
    const { title, type } = this.props.tabInfo;
    const currentGroupComponent = this.inventoryGroupTypeToComponent(type, rest);
    const currentHeaderComponent = this.inventoryGroupTypeToHeaderComponent(type, rest);

    return (
      <div className={'InventoryGroup'}>
        <div className="InventoryGroup-heading">
          <span className="InventoryGroup-title">{title}</span>
          {currentHeaderComponent}
        </div>
        {currentGroupComponent}
      </div>
    );
  }
}

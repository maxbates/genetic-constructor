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

import InventoryGroupRole from './InventoryGroupRole';
import InventoryGroupBlocks from './InventoryGroupBlocks';
import InventoryGroupSearch from './InventoryGroupSearch';
import InventoryGroupProjects from './InventoryGroupProjects';

import '../../styles/InventoryGroup.css';

export default class InventoryGroup extends Component {
  static propTypes = {
    title: PropTypes.string,
    type: PropTypes.string,
    actions: PropTypes.array,
    tabInfo: PropTypes.object.isRequired,
    currentProjectId: PropTypes.string,
  };

  inventoryGroupTypeToComponent = (type, props) => {
    switch (type) {
    case 'role' :
      return (<InventoryGroupRole {...props} />);
    case 'search-ncbi' :
      return (<InventoryGroupSearch source="ncbi" {...props}/>);
    case 'search-igem' :
      return (<InventoryGroupSearch source="igem" {...props}/>);
    case 'search-egf' :
      return (<InventoryGroupSearch source="egf" {...props}/>);
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
    const { actions, ...rest } = this.props;
    const { title, type } = this.props.tabInfo;
    const currentGroupComponent = this.inventoryGroupTypeToComponent(type, rest);

    //todo - define object model (from inventory.sections) + show these
    const actionButtons = !actions ? null : actions.map((action, index) => <div key={index}></div>);

    return (
      <div className={'InventoryGroup'}>
        <div className="InventoryGroup-heading">
          <span className="InventoryGroup-title">{title}</span>
          <div className="InventoryGroup-actions">
            {actionButtons}
          </div>
        </div>
        {currentGroupComponent}
      </div>
    );
  }
}

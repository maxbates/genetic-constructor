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
import invariant from 'invariant';
import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import InventoryGroupBlocks from './InventoryGroupBlocks';
import InventoryGroupProjects from './InventoryGroupProjects';
import InventoryGroupRole from './InventoryGroupRole';
import InventoryGroupCommons from './InventoryGroupCommons';
import InventoryGroupSearch from './InventoryGroupSearch';
import InventoryProjectHeader from './InventoryProjectHeader';
import DnD from '../../graphics/dnd/dnd';
import { blockClone, blockCreate, blockRename } from '../../actions/blocks';
import { projectAddConstruct, projectCreate, projectOpen } from '../../actions/projects';
import { focusConstruct } from '../../actions/focus';
import ConstructViewer from '../../graphics/views/constructviewer';
import { block as blockDragType } from '../../constants/DragTypes';

import '../../styles/InventoryGroup.css';

class InventoryGroup extends Component {
  static propTypes = {
    actions: PropTypes.array,
    blockCreate: PropTypes.func.isRequired,
    blockClone: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    tabInfo: PropTypes.shape({
      type: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    currentProjectId: PropTypes.string,
  };

  state = {
    dragInside: false,
  };

  /**
   * register as a drop target after mounting.
   */
  componentDidMount() {
    const self = ReactDOM.findDOMNode(this);
    DnD.registerTarget(self, {
      drop: this.onBlockDropped,
      dragEnter: this.onDragEnter,
      dragLeave: this.onDragLeave,
      zorder: 0,
    });
  }

  /**
   * unsink DND on unmount
   */
  componentWillUnmount() {
    const self = ReactDOM.findDOMNode(this);
    DnD.unregisterTarget(self);
  }

  /**
   * when blocks are dropped
   */
  onBlockDropped = (globalPosition, payload) => {
    if (this.props.tabInfo.type !== 'projects') {
      return;
    }
    // create a new project and add blocks as a construct
    // create project and add a default construct
    const project = this.props.projectCreate();
    this.props.projectOpen(project.id);

    const fromInventory = payload.source.indexOf('inventory') >= 0;
    //dont need to check if array, since inventory drags always are single items
    if (fromInventory && payload.type === blockDragType && payload.item.isConstruct()) {
      const construct = this.props.blockClone(payload.item.id);
      this.props.projectAddConstruct(project.id, construct.id, true);
      this.props.focusConstruct(construct.id);
    } else {
      const construct = this.props.blockCreate();
      this.props.blockRename(construct.id, 'New Construct');
      this.props.projectAddConstruct(project.id, construct.id, true);
      // we need the actual ConstructViewer to proceed
      window.setTimeout(() => {
        const constructViewer = ConstructViewer.getViewerForConstruct(construct.id);
        invariant(constructViewer, 'expect to find a viewer for the new construct');
        constructViewer.addItemAtInsertionPoint(payload, null, null);
        this.props.focusConstruct(construct.id);
      }, 1000);
    }
  };

  /**
   * drag enter, only valid for certain tabs
   */
  onDragEnter = () => {
    if (this.props.tabInfo.type === 'projects') {
      this.setState({ dragInside: true });
    }
  };

  onDragLeave = () => {
    if (this.props.tabInfo.type === 'projects') {
      this.setState({ dragInside: false });
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
      case 'commons':
        return (<InventoryGroupCommons {...props} />);
      default:
        //don't throw in production, let it just render empty
        if (process.env.NODE_ENV !== 'production') {
          throw new Error(`Type ${type} is not registered in InventoryGroup`);
        }
        return null;
    }
  };

  /**
   * returns the current component
   */
  inventoryGroupTypeToHeaderComponent = (type, props) => {
    switch (type) {
      case 'projects':
        return (<InventoryProjectHeader {...props} templates={false} dragInside={this.state.dragInside} />);//eslint-disable-line react/jsx-boolean-value
      case 'templates':
        return (<InventoryProjectHeader {...props} templates={true} />);//eslint-disable-line react/jsx-boolean-value

      default:
        return null;
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

export default connect(null, {
  blockCreate,
  blockClone,
  blockRename,
  projectCreate,
  projectOpen,
  projectAddConstruct,
  focusConstruct,
})(InventoryGroup);

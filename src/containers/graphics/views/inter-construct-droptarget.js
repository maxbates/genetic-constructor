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
import { blockClone, blockCreate } from '../../../actions/blocks';
import { focusConstruct } from '../../../actions/focus';
import { projectAddConstruct } from '../../../actions/projects';
import { block as blockDragType } from '../../../constants/DragTypes';
import DnD from '../dnd/dnd';
import ConstructViewer from './constructviewer';

import '../../../styles/inter-construct-droptarget.css';

export class DropTarget extends Component {
  static propTypes = {
    blockCreate: PropTypes.func.isRequired,
    blockClone: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    currentProjectId: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
  };

  state = {
    hovered: false,
  };

  /**
   * register as a drop target after mounting.
   */
  componentDidMount() {
    const self = ReactDOM.findDOMNode(this);
    DnD.registerTarget(self, {
      drop: this.onDrop,
      dragEnter: () => {
        this.setState({ hovered: true });
      },
      dragLeave: () => {
        this.setState({ hovered: false });
      },
      zorder: -1,
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
   * create a new construct, add dropped block to it
   */
  onDrop = (globalPosition, payload) => {
    // clone construct and add to project if a construct from inventory otherwise
    // treat as a list of one or more blocks
    //if the block is from the inventory, we've cloned it and dont need to worry about forcing the projectId when we add the components
    const fromInventory = payload.source.indexOf('inventory') >= 0;
    //dont need to check if array, since inventory drags always are single items
    if (fromInventory && payload.type === blockDragType && payload.item.isConstruct()) {
      const construct = this.props.blockClone(payload.item.id);
      this.props.projectAddConstruct(this.props.currentProjectId, construct.id, true, this.props.index);
      this.props.focusConstruct(construct.id);
    } else {
      const construct = this.props.blockCreate();
      this.props.projectAddConstruct(this.props.currentProjectId, construct.id, true, this.props.index);
      const constructViewer = ConstructViewer.getViewerForConstruct(construct.id);
      invariant(constructViewer, 'expect to find a viewer for the new construct');
      constructViewer.addItemAtInsertionPoint(payload, null, null);
      this.props.focusConstruct(construct.id);
    }
  };

  /**
   * render the component, the scene graph will render later when componentDidUpdate is called
   */
  render() {
    const classes = `inter-construct-drop-target ${this.state.hovered ? 'inter-construct-drop-target-hovered' : ''}`;
    return (
      <div
        className={classes}
        data-index={this.props.index}
      />
    );
  }
}

export default connect(null, {
  focusConstruct,
  projectAddConstruct,
  blockClone,
  blockCreate,
})(DropTarget);

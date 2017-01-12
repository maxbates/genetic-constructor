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

import { focusBlocks } from '../../../actions/focus';
import { projectAddConstruct } from '../../../actions/projects';
import { projectGet, projectGetVersion } from '../../../selectors/projects';
import ConstructViewer from './constructviewer';
import '../../../styles/constructviewercanvas.css';
import DnD from '../dnd/dnd';
import MouseTrap from '../mousetrap';
import DropTarget from './dropTarget';

export class ConstructViewerCanvas extends Component {
  static propTypes = {
    focusBlocks: PropTypes.func.isRequired,
    projectGet: PropTypes.func.isRequired,
    currentProjectId: PropTypes.string.isRequired,
    constructs: PropTypes.array.isRequired,
  };

  /**
   * register as drop target when mounted, use -1 for zorder to ensure
   * higher values ( constructviewers ) will get dropped on first
   */
  componentDidMount() {
    const self = ReactDOM.findDOMNode(this);
    // monitor drag overs to autoscroll the canvas when the mouse is near top or bottom
    DnD.registerMonitor(self, {
      monitorOver: this.mouseScroll.bind(this),
      monitorEnter: () => {},
      monitorLeave: this.endMouseScroll.bind(this),
    });
    // mouse trap is used for coordinate transformation
    this.mouseTrap = new MouseTrap({
      element: self,
    });
  }

  /**
   * scroll to top when a new construct viewer is added
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.constructs.length > this.props.constructs.length) {
      ReactDOM.findDOMNode(this).scrollTop = 0;
    }
  }

  /**
   * unregister DND handlers
   */
  componentWillUnmount() {
    DnD.unregisterMonitor(ReactDOM.findDOMNode(this));
    this.mouseTrap.dispose();
    this.mouseTrap = null;
  }

  /**
   * track clicks to unselect blocks
   */
  onMouseDown = (evt) => {
    this.down = evt.target === ReactDOM.findDOMNode(this) && evt.button === 0;
  };

  onMouseUp = (evt) => {
    if (this.down && evt.button === 0) {
      this.down = false;
      evt.preventDefault();
      evt.stopPropagation();
      this.props.focusBlocks([]);
    }
  };

  /**
   * true if current project is a sample project
   */
  isSampleProject() {
    return this.props.projectGet(this.props.currentProjectId).rules.frozen;
  }

  /**
   * end mouse scrolling
   */
  endMouseScroll = () => {
    this.autoScroll(0);
  };

  /**
   * auto scroll in the given direction -1, towards top, 0 stop, 1 downwards.
   */
  autoScroll(direction) {
    invariant(direction >= -1 && direction <= 1, 'bad direction -1 ... +1');
    this.autoScrollDirection = direction;

    // we need a bound version of this.autoScrollUpdate to use for animation callback to avoid
    // creating a closure at 60fps
    if (!this.autoScrollBound) {
      this.autoScrollBound = this.autoScrollUpdate.bind(this);
    }
    // cancel animation if direction is zero
    if (this.autoScrollDirection === 0) {
      if (this.autoScrollRequest) {
        window.cancelAnimationFrame(this.autoScrollRequest);
        this.autoScrollRequest = 0;
      }
    } else {
      // setup animation callback as required
      if (!this.autoScrollRequest) {
        this.autoScrollRequest = window.requestAnimationFrame(this.autoScrollBound);
      }
    }
  }

  autoScrollUpdate() {
    invariant(this.autoScrollDirection === -1 || this.autoScrollDirection === 1, 'bad direction for autoscroll');
    const el = ReactDOM.findDOMNode(this);
    el.scrollTop += this.autoScrollDirection * 8;
    // start a new request unless the direction has changed to zero
    this.autoScrollRequest = this.autoScrollDirection ? window.requestAnimationFrame(this.autoScrollBound) : 0;
  }

  /**
   * start, continue or stop autoscroll based on given global mouse position
   */
  mouseScroll = (globalPosition) => {
    const local = this.mouseTrap.globalToLocal(globalPosition, ReactDOM.findDOMNode(this));
    const box = this.mouseTrap.element.getBoundingClientRect();
    // autoscroll threshold is clamped at a percentage of height otherwise when the window is short
    // it can become impossible to target a specific element
    const edge = Math.max(0, Math.min(100, box.height * 0.25));
    if (local.y < edge) {
      this.autoScroll(-1);
    } else if (local.y > box.height - edge) {
      this.autoScroll(1);
    } else {
      // cancel the autoscroll
      this.autoScroll(0);
    }
  };

  /**
   * render the component, the scene graph will render later when componentDidUpdate is called
   */
  render() {
    // map construct viewers so we can pass down mouseScroll and endMouseScroll as properties
    // and inject drop targets before each construct and at the end IF there is more than one construct

    const elements = [];
    this.props.constructs.forEach((construct, index) => {
      if (!this.isSampleProject()) {
        elements.push(<DropTarget
          currentProjectId={this.props.currentProjectId}
          index={index}
          key={index}
        />);
      }
      elements.push(<ConstructViewer
        mouseScroll={this.mouseScroll}
        endMouseScroll={this.endMouseScroll}
        currentProjectId={this.props.currentProjectId}
        key={construct.id}
        projectId={this.props.currentProjectId}
        constructId={construct.id}
        testIndex={index}
      />);
    });
    // put a drop target at the end, force a unique key so it won't clash with the other drop targets
    if (!this.isSampleProject()) {
      elements.push(<DropTarget
        currentProjectId={this.props.currentProjectId}
        index={this.props.constructs.length}
        key={this.props.constructs.length}
      />);
    }

    // map construct viewers so we can propagate projectId and any recently dropped blocks
    return (
      <div
        className="ProjectPage-constructs no-vertical-scroll"
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
      >
        {elements}
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    projects: state.projects,
  };
}

export default connect(mapStateToProps, {
  focusBlocks,
  projectAddConstruct,
  projectGetVersion,
  projectGet,
})(ConstructViewerCanvas);

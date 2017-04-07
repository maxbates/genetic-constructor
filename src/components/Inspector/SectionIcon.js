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
import ReactDOM from 'react-dom';
import DnD from '../../graphics/dnd/dnd';

//note - Section Icons are defined in CSS, so they can be webpacked
import '../../styles/SectionIcon.css';

export default class SectionIcon extends Component {
  static propTypes = {
    section: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    dragTarget: PropTypes.bool,
  };

  state = {
    hover: false,
    dragInside: false,
  };

  /**
   * register as a drop target after mounting.
   */
  componentDidMount() {
    if (this.props.dragTarget) {
      const self = ReactDOM.findDOMNode(this);
      DnD.registerTarget(self, {
        drop: () => {},
        dragEnter: () => {
          this.setState({ dragInside: true });
          this.startSwitchTimer();
        },
        dragLeave: () => {
          this.setState({ dragInside: false });
          this.endSwitchTimer();
        },
        zorder: 10,
      });
    }
  }

  /**
   * unsink DND on unmount
   */
  componentWillUnmount() {
    if (this.props.dragTarget) {
      const self = ReactDOM.findDOMNode(this);
      DnD.unregisterTarget(self);
      this.endSwitchTimer();
    }
  }

  /**
   * a click either selects the section if unselected or toggle the parent
   * if already selected
   * @param event
   */
  onClick = (event) => {
    if (event) {
      event.stopPropagation();
    }
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
    this.setState({ hover: true });
  };
  onLeave = () => {
    this.setState({ hover: false });
  };

  /**
   * called when a drag over occurs, defer the switch to the panel just a fraction of second.
   */
  startSwitchTimer() {
    this.endSwitchTimer();
    this.timer = window.setTimeout(() => {
      if (!this.props.open || !this.props.selected) {
        this.onClick();
      }
    }, 400);
  }

  endSwitchTimer() {
    window.clearTimeout(this.timer);
  }

  render() {
    const highlight = this.props.selected;
    let containerClass = 'SectionIcon';
    if (this.props.open) {
      if (highlight) {
        containerClass += ' Highlighted';
      } else {
        containerClass += ' Closed';
      }
    } else {
      containerClass += ' Closed';
    }
    return (
      <div
        data-section={this.props.section}
        className={containerClass}
        onMouseEnter={this.onEnter}
        onMouseLeave={this.onLeave}
        data-selected={this.props.selected}
        onClick={this.onClick}
      >
        <div
          className={`SectionIcon-icon SectionIcon-${this.props.section}`}
          title={this.props.section}
        />
      </div>
    );
  }
}

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

import Switch from '../ui/Switch';
import Expando from '../ui/Expando';

import '../../styles/InspectorRow.css';

export default class InspectorRow extends Component {
  static propTypes = {
    heading: PropTypes.string.isRequired,
    hasToggle: PropTypes.bool, //can have toggle or switch
    hasSwitch: PropTypes.bool, //can have toggle or switch
    switchDisabled: PropTypes.bool, //switch is disabled
    glyphUrl: PropTypes.string, //only !hasToggle
    forceActive: PropTypes.bool,
    onToggle: PropTypes.func,
    condition: PropTypes.bool, //whether to show content
    capitalize: PropTypes.bool, //capitalize heading
    children: PropTypes.node,
  };

  static defaultProps = {
    condition: true,
    hasToggle: false,
    hasSwitch: false,
    switchDisabled: false,
    onToggle: () => {},
  };

  state = {
    active: false,
  };

  getActiveState = () => {
    const { forceActive } = this.props;
    return (forceActive === true || forceActive === false) ? forceActive : this.state.active;
  };

  handleToggle = () => {
    const nextState = !this.getActiveState();
    this.setState({ active: nextState });
    this.props.onToggle(nextState);
  };

  render() {
    const { heading, glyphUrl, hasToggle, hasSwitch, switchDisabled, condition, capitalize, children } = this.props;

    if (!children && !hasSwitch) {
      return null;
    }

    if (!condition) {
      return (<div className="InspectorRow" />);
    }

    const isActive = this.getActiveState();

    const content = hasToggle ?
      (
        <Expando
          text={heading}
          showArrowWhenEmpty
          capitalize={capitalize}
          onClick={() => this.handleToggle()}
        >
          {isActive && children}
        </Expando>
      ) : (
        <div className="InspectorRow-heading">
          {glyphUrl && (
            <div
              className="InspectorRow-heading-glyph"
              style={{ backgroundImage: `url(${glyphUrl})` }}
            />
          )}
          <span className="InspectorRow-heading-text">{heading}</span>
          {hasSwitch && (
            <div className="InspectorRow-heading-switch">
              <Switch on={isActive} switched={this.handleToggle} disabled={switchDisabled} />
            </div>
          )}
        </div>
      );

    return (
      <div className={`InspectorRow${hasToggle ? ' compact' : ''}`}>
        {content}
        {(hasToggle !== true || (hasSwitch && isActive)) && children}
      </div>
    );
  }
}

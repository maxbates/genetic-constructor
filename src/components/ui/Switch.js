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

import '../../styles/Switch.css';

export default class Switch extends Component {
  static propTypes = {
    on: PropTypes.bool.isRequired,
    disabled: PropTypes.bool,
    switched: PropTypes.func.isRequired,
  };

  onFlick = () => {
    if (!this.props.disabled) {
      this.props.switched(!this.props.on);
    }
  };

  render() {
    const switchClass = `slider-switch ${this.props.disabled ? 'slider-switch-disabled' : ''}`;
    const nobClass = `slider-switch-nob ${this.props.on ? 'slider-switch-nob-on' : ''}`;
    return (
      <div
        className={switchClass}
        onClick={this.onFlick}>
        <div className={nobClass}></div>
      </div>
    );
  }
}

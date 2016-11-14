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

  };

  constructor() {
    super();
    this.state = {
      on: false,
    }
  }

  onFlick = () => {
    this.setState({
      on: !this.state.on,
    });
  };

  render() {
    return (
      <div
        className="slider-switch"
        onClick={this.onFlick}>
        <div className={`slider-switch-nob ${this.state.on ? 'slider-switch-nob-on' : ''}`}></div>
      </div>
    )
  }
}

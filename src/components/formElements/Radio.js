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
//todo

import React, { Component, PropTypes } from 'react';

import '../../styles/Radio.css';

export default class Radio extends Component {
  static propTypes = {
    active: PropTypes.bool,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
  };

  onClick = (evt) => {
    evt.preventDefault();
    const { disabled, onClick } = this.props;
    if (disabled || !onClick) {
      return;
    }
    onClick(evt);
  };

  render() {
    const { active, disabled, ...rest } = this.props;
    return (
      <div
        {...rest}
        className={`Checkbox${
          active ? ' active' : ''
          }${disabled ? ' disabled' : ''}`}
        onClick={evt => this.onClick(evt)}
      />
    );
  }
}
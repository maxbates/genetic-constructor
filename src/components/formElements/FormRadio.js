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

import RadioInner from './Radio';

export default class FormRadio extends Component {
  static propTypes = {
    checked: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    disabled: PropTypes.bool,
  };

  onClick = (evt) => {
    evt.preventDefault();
    const { disabled, onChange } = this.props;
    if (disabled || !onChange) {
      return;
    }
    onChange(evt);
  };

  render() {
    const { label, onChange, ...rest } = this.props;

    return (
      <div className="formElement FormRadio">
        <RadioInner {...rest} onClick={this.onClick} />
        <span className="formElement-label" onClick={this.onClick}>{label}</span>
      </div>
    );
  }
}

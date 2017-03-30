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
import React, { PropTypes, Component } from 'react';
import invariant from 'invariant';

import FormText from '../formElements/FormText';

import '../../styles/InspectorDetailEditor.css';

//editor that can pure render, or handle state internally and trigger a onblur event
export default class InspectorDetailEditor extends Component {
  static propTypes = {
    value: PropTypes.string,
    initialValue: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    title: PropTypes.string,
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    invariant(typeof props.value === 'string' || typeof props.initialValue === 'string', 'must pass value or initialValue');
    invariant(typeof props.value !== 'string' || typeof props.onChange === 'function', 'onChange required with value');
    invariant(typeof props.initialValue !== 'string' || typeof props.onBlur === 'function', 'onBlur required with initialValue');

    this.state = {
      value: props.value || props.initialValue || '',
    };
  }

  onChange = (evt) => {
    if (this.props.onChange) {
      this.props.onChange(evt);
    } else {
      this.setState({ value: evt.target.value });
    }
  };

  onBlur = (evt) => {
    if (this.props.onBlur) {
      this.props.onBlur(evt);
    }
  };

  render() {
    const { value, title, initialValue, onChange, onBlur, ...rest } = this.props; //eslint-disable-line no-unused-vars

    const inputValue = typeof value === 'string' ? value : this.state.value;

    return (
      <div className="InspectorDetailSection InspectorDetailEditor">
        {!!title && <div className="InspectorDetailEditor-title">{title}</div>}

        {/* hiding this for now */}
        {(false && this.props.disabled !== true) && (
          <div className="InspectorDetailSection-headerGlyphs">
            <img
              role="presentation"
              src="/images/ui/edit-dark.svg"
              className="InspectorDetailSection-headerGlyph"
            />
          </div>
        )}

        <FormText
          useTextarea
          rows="2"
          transparent
          {...rest}
          value={inputValue}
          onChange={this.onChange}
          onBlur={this.onBlur}
        />
      </div>
    );
  }
}

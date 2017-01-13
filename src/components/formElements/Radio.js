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

//this component is just the bulls-eye of the radio. Check FormRadio for the label etc.

import React, { Component, PropTypes } from 'react';

import '../../styles/Radio.css';

export default function Radio(props) {
  const { checked, disabled, onClick, ...rest } = props;

  const classes = `Radio${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}`;
  const handleClick = (evt) => {
    if (!disabled) {
      onClick(evt);
    }
  };

  return (
    <div
      {...rest}
      className={classes}
      onClick={handleClick}
    >
      <div className="Radio-inner" />
    </div>
  );
}

Radio.propTypes = {
  checked: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

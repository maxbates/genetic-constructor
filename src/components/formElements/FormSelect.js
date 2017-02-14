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

import React, { PropTypes } from 'react';
import { Creatable } from 'react-select';

// documentation
// https://github.com/JedWatson/react-select

import '../../styles/FormSelect.css';

//todo - prevent spaces, force lowercase

export default function FormSelect(props) {
  const { className, ...rest } = props;

  const classes = `formElement formSelect errorStyle ${className}`;

  return (
    <Creatable
      className={classes}
      {...rest}
    />
  );
}


FormSelect.propTypes = {
  className: PropTypes.string,
  multi: PropTypes.bool,
  value: PropTypes.any,
  options: PropTypes.array,
  onChange: PropTypes.func,
};

FormSelect.defaultProps = {
  multi: true,
  value: undefined,
  onChange: (value) => {},
  options: [],
};

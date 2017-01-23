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
import Arrow from './Arrow';

import '../../styles/Toggler.css';


export default function Toggler({ onClick, hidden, open, disabled }) {
  if (hidden) {
    return null;
  }

  return (<div className="Toggler">
    <Arrow
      direction={open ? 'down' : 'right'}
      disabled={disabled}
      onClick={onClick}
      hidden={false}
    />
  </div>);
}

Toggler.propTypes = {
  onClick: PropTypes.func,
  open: PropTypes.bool,
  disabled: PropTypes.bool,
  hidden: PropTypes.bool,
};

Toggler.defaultProps = {
  onClick: () => {},
  style: {},
  hidden: false,
  open: false,
  disabled: false,
};

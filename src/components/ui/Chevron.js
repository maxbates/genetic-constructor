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

import '../../styles/Chevron.css';

export default class Chevron extends Component {
  static propTypes = {
    // ['up', 'down', 'left', 'right']
    direction: PropTypes.string.isRequired,
  };

  render() {
    const classes = `corner ${this.props.direction}`;
    return (
      <div className="chevron" >
        <div className={classes} />
      </div>
    );
  }
}

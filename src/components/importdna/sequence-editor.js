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

import '../../../src/styles/sequence-editor.css';

export default class SequenceEditor extends Component {

  static propTypes = {
    sequence: PropTypes.string.isRequired,
  };

  constructor() {
    super();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sequence !== this.props.sequence) {
      console.log('getting a new sequence');
    }
  }

  render() {
    return (
      <div className="sequence-editor">
        <div className="row-index">0123456789</div>
        <div className="sequence">{this.props.sequence}</div>
      </div>
    )
  }
}
/*
  1           ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  41          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
  81          ATGCATGCAT ATGCATGCAT ATGCATGCAT ATGCATGCAT
 */

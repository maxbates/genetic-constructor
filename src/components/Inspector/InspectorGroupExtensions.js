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
import { connect } from 'react-redux';
import Switch from '../ui/Switch';

import {
  uiSetGrunt,
} from '../../actions/ui';

import '../../styles/InspectorGroupExtensions.css';


class InspectorGroupExtensions extends Component {
  static propTypes = {
  };

  constructor() {
    super();
    this.state = {
      a: false,
      b: true,
      c: false,
      d: true,
    }
  }

  switched(which, newValue) {
    console.log(`Switch: ${newValue ? 'ON' : 'OFF'}`);
    this.setState({[which] : newValue});
  };

  render() {
    return (<div className="InspectorGroupExtensions">
      <Switch on={this.state.a} disabled={false} switched={this.switched.bind(this, 'a')}/>
      <br/>
      <Switch on={this.state.b} disabled={false} switched={this.switched.bind(this, 'b')}/>
      <br/>
      <Switch on={this.state.c} disabled={true} switched={this.switched.bind(this, 'c')}/>
      <br/>
      <Switch on={this.state.d} disabled={true} switched={this.switched.bind(this, 'd')}/>
    </div>);
  }
}

function mapStateToProps(state, props) {
  return {};
}

export default connect(mapStateToProps, {
  uiSetGrunt,
})(InspectorGroupExtensions);


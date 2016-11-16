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
import Arrow from './Arrow';
import Label from './Label';

import '../../styles/Expando.css';

export default class Expando extends Component {
  static propTypes = {
    text: PropTypes.string.isRequired,
    content: PropTypes.object.isRequired,
    headerWidgets: PropTypes.array,
  };

  constructor() {
    super();
    this.state = {
      open: false,
    };
  }

  onToggle = () => {
    this.setState({
      open: !this.state.open,
    });
  };

  render() {
    return (
      <div className="expando">
        <div className="header">
          <Arrow
            direction={this.state.open ? 'down' : 'right'}
            onClick={this.onToggle}
          />
          <Label
            text={this.props.text}
            hover
            onClick={this.onToggle}
            styles={{
              marginLeft: '0.5rem',
              marginRight: this.props.headerWidgets && this.props.headerWidgets.length ? '0.5rem' : '0',
              flexGrow: 1,
              display: 'inline-block',
              userSelect: 'none',
            }}
          />
          <div className="header-extras">
            {this.props.headerWidgets}
          </div>
        </div>
        <div className={this.state.open ? 'content-visible' : 'content-hidden'}>
          {this.props.content}
        </div>
      </div>
    );
  }
}

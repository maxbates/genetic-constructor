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
import Selector from '../../containers/orders/selector';

import '../../styles/InspectorGroupFeedback.css';
import '../../styles/ordermodal.css';


export default class InspectorGroupFeedback extends Component {
  static propTypes = {
  };

  /**
   * when the destination for feedback is changed
   * @param val
   */
  feedbackToChanged(val) {
    console.log('Feedback To:', val);
  }

  toOptions = [
    'Autodesk GSL: Editor Team',
    'Genetic Constructor Team',
    'Donald J trump',
  ];

  render() {
    return (<div className="InspectorGroupFeedback">
      <span className="bold">How would you rate this software right now?</span>
      <div className="star-box">
        <div className="star-five star-five-small star-1"></div>
        <div className="star-five star-five-small star-2"></div>
        <div className="star-five star-five-small star-3"></div>
        <div className="star-five star-five-small star-4"></div>
        <div className="star-five star-five-small star-5" onMouseEnter={() => {
          console.log('Mouse Enter Star 5');
        }}></div>
      </div>
      <hr/>
      <span className="bold">I would recommend this software to others.</span>
      <input type="range"/>
      <div class="range-labels">
        <span className="light">Strongly disagree</span>
        <span className="light" style={{float: 'right'}}>Strongly agree</span>
      </div>
      <hr/>
      <span className="bold">Tell us what you think</span>
      <br/>
      <br/>
      <Selector
        options={this.toOptions}
        onChange={this.feedbackToChanged}
        disabled={false}
        value={this.toOptions[0]}
      />
    </div>);
  }
}


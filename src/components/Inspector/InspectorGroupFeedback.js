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

  constructor() {
    super();
    this.state = {
      feedbackTo: this.toOptions[0],
      star0: false,
      star1: false,
      star2: false,
      star3: false,
      star4: false,
    }
  }

  toOptions = [
    'Autodesk GSL: Editor Team',
    'Genetic Constructor Team',
    'Donald J trump',
  ];

  /**
   * when the destination for feedback is changed
   * @param val
   */
  feedbackToChanged = (val) => {
    this.setState({
      feedbackTo: val,
    });
  }

  /**
   * mouse over a star
   * @param index
   */
  overStar(index) {
    this.setState({
      star0: index >= 0,
      star1: index >= 1,
      star2: index >= 2,
      star3: index >= 3,
      star4: index >= 4,
    });
  }
  /**
   * user clicked a star rating
   * @param index
   */
  starRating(index) {
    alert(index);
  }

  render() {
    const url = "http://www.geneticconstructor.com";

    return (<div className="InspectorGroupFeedback">
      <span className="bold">How would you rate this software right now?</span>
      <div className="star-box">
        <div
          className={`star-five star-five-small star-0 ${this.state.star0 ? '' : 'star-gray'}`}
          onClick={this.starRating.bind(this, 0)}
          onMouseEnter={this.overStar.bind(this, 0)}
          onMouseLeave={this.overStar.bind(this, -1)}>
        </div>
        <div
          className={`star-five star-five-small star-1 ${this.state.star1 ? '' : 'star-gray'}`}
          onClick={this.starRating.bind(this, 1)}
          onMouseEnter={this.overStar.bind(this, 1)}
          onMouseLeave={this.overStar.bind(this, -1)}>
        </div>
        <div
          className={`star-five star-five-small star-2 ${this.state.star2 ? '' : 'star-gray'}`}
          onClick={this.starRating.bind(this, 2)}
          onMouseEnter={this.overStar.bind(this, 2)}
          onMouseLeave={this.overStar.bind(this, -1)}>
        </div>
        <div
          className={`star-five star-five-small star-3 ${this.state.star3 ? '' : 'star-gray'}`}
          onClick={this.starRating.bind(this, 3)}
          onMouseEnter={this.overStar.bind(this, 3)}
          onMouseLeave={this.overStar.bind(this, -1)}>
        </div>
        <div
          className={`star-five star-five-small star-4 ${this.state.star4 ? '' : 'star-gray'}`}
          onClick={this.starRating.bind(this, 4)}
          onMouseEnter={this.overStar.bind(this, 4)}
          onMouseLeave={this.overStar.bind(this, -1)}>
        </div>
      </div>
      <hr/>
      <span className="bold">I would recommend this software to others.</span>
      <input type="range"/>
      <div className="range-labels">
        <span className="light">Strongly disagree</span>
        <span className="light" style={{float: 'right'}}>Strongly agree</span>
      </div>
      <hr/>
      <span className="bold">Tell us what you think</span>
      <br/>
      <br/>
      <span className="light">To</span>
      <Selector
        options={this.toOptions}
        onChange={this.feedbackToChanged}
        disabled={false}
        value={this.state.feedbackTo}
      />
      <br/>
      <textarea
        placeholder="Enter your feedback here"
        rows="20"
      />
      <br/>
      <span className="light">Feedback is published on Github</span>
      <br/>
      <br/>
      <input type="checkbox"/>
      <span className="light checkbox-label">Publish Anonymously</span>
      <button className="publish-button">Publish</button>
      <hr/>
      <span className="bold">Share Genetic Constructor</span>
      <div className="socialist">
        <a href="https://www.facebook.com/sharer/sharer.php?u=www.geneticconstructor.com" target="_blank">
          <img className="social-button" src="/images/ui/social-facebook.svg"/>
        </a>
        <a href="https://twitter.com/home?status=www.geneticconstructor.com" target="_blank">
          <img className="social-button" src="/images/ui/social-twitter.svg"/>
        </a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&url=www.geneticconstructor.com&title=Autodesk%20-%20Genetic%20Constructor&summary=DNS%20Design%20Tools%20from%20Autodesk&source=www.geneticconstructor.com" target="_blank">
          <img className="social-button" src="/images/ui/social-linkedin.svg"/>
        </a>
        <a href="https://plus.google.com/share?url=www.geneticconstructor.com" target="_blank">
          <img className="social-button" src="/images/ui/social-google+.svg"/>
        </a>
        <a href="mailto:?&subject=Autodesk - Genetic Constructor">
          <img className="social-button" src="/images/ui/social-email.svg"/>
        </a>
      </div>

    </div>);
  }
}


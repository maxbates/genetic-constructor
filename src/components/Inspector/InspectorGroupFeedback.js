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
import Selector from '../../containers/orders/selector';
import debounce from 'lodash.debounce';
import {
  uiSetGrunt,
} from '../../actions/ui';

import '../../styles/InspectorGroupFeedback.css';

class InspectorGroupFeedback extends Component {
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
      starClicked: false,
      anon: false,
    }
  }

  toOptions = [
    'Autodesk GSL: Editor Team',
    'Genetic Constructor Team',
  ];

  /**
   * when the destination for feedback is changed
   * @param val
   */
  feedbackToChanged = (val) => {
    this.setState({
      feedbackTo: val,
    });
  };

  /**
   * mouse over a star
   * @param index
   */
  overStar(index) {
    // do not reset stars on mouse leave if the user already clicked a star
    if (index === -1 && this.state.starClicked) {
      return;
    }
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
   * @param index 0..4
   */
  starRating(index) {
    const value = Number.parseFloat(index);
    this.setState({starClicked: true});
    this.props.uiSetGrunt('Thanks for your feedback.');
  }

  /**
   * user changed the slider. onInput/onChange are not implemented correctly in most
   * browsers so the timing is unreliable. We use the onInput event but debounce the updating
   * of the value the user selects.
   * @param event
   */
  onRecommendChanged = debounce(() => {
    // value is 0..100
    const value = Number.parseFloat(this.refs.rangeSlider.value);
    this.props.uiSetGrunt('Thanks for your feedback.');
  }, 5000, {leading: false, trailing: true});

  /**
   * toggle anon mode
   */
  onAnonChanged = (event) => {
    this.setState({anon: !this.state.anon});
  };

  /**
   * user wants to publish feedback
   */
  onPublishFeedback = () => {
    const team = this.state.feedbackTo;
    const anon = this.state.anon;
    const message = this.refs.feedbackText.value.trim();
    if (message) {
      this.props.uiSetGrunt('Thanks for your feedback.');
      alert(`Team: ${team}\nAnon: ${anon}\nMessage: ${message}`);
    } else {
      this.props.uiSetGrunt('Please enter some feedback first.');
    }
  };

  render() {
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
      <input type="range" min="0" max="100" step="1" defaultValue="50" onInput={this.onRecommendChanged} ref="rangeSlider"/>
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
        ref="feedbackText"
      />
      <br/>
      <span className="light">Feedback is published on Github</span>
      <br/>
      <br/>
      <input type="checkbox" defaultValue={this.state.anon} onChange={this.onAnonChanged}/>
      <span className="light checkbox-label">Publish Anonymously</span>
      <button className="publish-button" onClick={this.onPublishFeedback}>Publish</button>
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

function mapStateToProps(state, props) {
  return {};
}

export default connect(mapStateToProps, {
  uiSetGrunt,
})(InspectorGroupFeedback);


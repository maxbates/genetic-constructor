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

//we have our custom captcha component because the existing ones dont handle invisible captchas (which is what we wanted for the registration modal)

import React, { Component, PropTypes } from 'react';
import loadScript from 'load-script';

//load the captcha API asynchronously (loads after the bundle)
let scriptLoaded = false;
function loadCaptchaScript() {
  return new Promise((resolve, reject) => {
    //bind onload event to the window
    window.onCaptchaLoad = function onCaptchaLoad() {
      scriptLoaded = true;
      resolve();
    };

    if (scriptLoaded === true) {
      return resolve();
    }

    loadScript('https://www.google.com/recaptcha/api.js?onload=onCaptchaLoad&render=explicit', (err) => {
      if (err) {
        return reject(err);
      }
    });
  });
}

let counter = 0;

/* global grecaptcha:false */

export default class Captcha extends Component {
  static propTypes = {
    onVerify: PropTypes.func.isRequired,
    onExpire: PropTypes.func,
    sitekey: PropTypes.string,
    theme: PropTypes.oneOf(['dark', 'light']),
    type: PropTypes.oneOf(['image', 'audio']),
    size: PropTypes.oneOf(['compact', 'normal']),
  };

  static defaultProps = {
    sitekey: '6LcJXRoUAAAAAKaVC2gACevP7RGA9onCKQXM_Qe6',
    theme: 'light',
    type: 'image',
    size: 'normal',
  };

  constructor(props) {
    super(props);
    this.count = counter++;
  }

  componentDidMount() {
    //captcha will complain when hot-load and remount
    if (this.widgetId) {
      return;
    }

    loadCaptchaScript()
    .then(() => {
      this.widgetId = grecaptcha.render(this.captcha, {
        sitekey: this.props.sitekey,
        type: this.props.type,
        theme: this.props.theme,
        size: this.props.size,
        inherit: true,
        callback: this.props.onVerify, //passes the token, or could call getReponse
        'expired-callback': this.props.onExpire,
      });
    })
    .catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error rendering captcha'); //eslint-disable-line no-console
        console.log(err); //eslint-disable-line no-console
        console.log(err.stack); //eslint-disable-line no-console
      }
    });
  }

  getResponse() {
    grecaptcha.getResponse(this.widgetId);
  }

  reset() {
    grecaptcha.reset(this.widgetId);
  }

  styles = {
    height: '78px',
    /*
     //to center the captcha
     display: 'flex',
     flexDirection: 'row',
     justifyContent: 'space-around',
     */
  };

  render() {
    return (
      <div
        ref={(el) => { this.captcha = el; }}
        style={this.styles}
        id={`recaptcha-${this.count}`}
        className="g-recaptcha"
        data-size="invisible"
      />
    );
  }
}

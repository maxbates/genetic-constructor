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
loadScript('https://www.google.com/recaptcha/api.js');

let counter = 0;

export default class Captcha extends Component {
  static propTypes = {
    onVerify: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.count = counter++;
  }

  //note - captcha will complain when hot-load and remount
  componentDidMount() {
    try {
      this.widgetId = grecaptcha.render(this.captcha, {
        sitekey: '6LdvyREUAAAAAKr6h7kyBzioJsXPGNKjW9r21WSh',
        inherit: true,
        callback: this.onSubmit,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error rendering captcha'); //eslint-disable-line no-console
        console.log(err); //eslint-disable-line no-console
        console.log(err.stack); //eslint-disable-line no-console
      }
    }

    //will override the previous one
    //we could use the ID (count) if need to support multiple
    window.onCaptchaSubmit = this.onSubmit;
  }

  onSubmit = (token) => {
    this.props.onVerify(true);
  };

  styles = {
    height: '78px',
    /*
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

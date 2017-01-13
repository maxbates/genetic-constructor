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
import React, { Component } from 'react';

import { dispatch } from '../store/index';
import { uiShowAuthenticationForm } from '../actions/ui';

import '../styles/LandingPage.css';

export default class LandingPage extends Component {
  static onMessageHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const { data, origin } = evt;

    //for security, verify the message origin
    //if these don't match... we have a problem
    if (origin !== window.location.origin) {
      if (heap && heap.track) {
        heap.track('REGISTER_ERROR', {
          origin,
          host: window.location.origin,
        });
      }
      return;
    }

    //tracking with heap
    if (heap && heap.track) {
      heap.track('Register_Interest', { type: data });
    }

    dispatch(uiShowAuthenticationForm('register', { type: data }));
  }

  componentDidMount() {
    window.addEventListener('message', LandingPage.onMessageHandler, false);
  }

  componentWillUnmount() {
    window.removeEventListener('message', LandingPage.onMessageHandler);
  }

  render() {
    return (
      <iframe
        ref={(el) => { this.iframe = el; }}
        sandbox="allow-same-origin allow-scripts"
        className="LandingPage"
        src="/landing_page_content/index.html"
      />
    );
  }
}

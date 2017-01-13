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
import Modal from '../components/Modal';

import '../styles/LandingPage.css';

export default class LandingPage extends Component {
  constructor() {
    super();

    this.listener = (evt) => {
      evt.preventDefault();
      evt.stopPropagation();

      const { data, origin } = evt;

      //for security, verify the message origin
      if (origin !== window.location.origin) {
        console.log('diferent origins, skipping');
        console.log(evt);
        return;
      }

      //tracking with heap
      if (heap && heap.track) {
        heap.track('Register_Interest', { type: data });
      }

      this.showRegisterForm(data);
    };
  }

  state = { open: true };

  componentDidMount() {
    window.addEventListener('message', this.listener, false);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.listener);
  }

  showRegisterForm = (type = 'free') => {
    dispatch(uiShowAuthenticationForm('register', { type }));
  };

  render() {
    //todo - remove new register dialog from this component

    const actions = [{
      text: 'Sign Up',
      disabled: () => false,
      onClick: () => console.log('clicked!'),
    }];

    return (
      <div>
        <Modal
          isOpen={this.state.open}
          onClose={() => this.setState({ open: false })}
          actions={actions}
          title="Register"
        >
          <p>Some Content</p>
        </Modal>
        <iframe
          ref={(el) => { this.iframe = el; }}
          sandbox="allow-same-origin allow-scripts"
          className="LandingPage"
          src="/landing_page_content/index.html"
        />
      </div>
    );
  }
}

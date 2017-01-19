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

import { dispatch } from '../store/index';
import { uiSetGrunt, uiShowAuthenticationForm } from '../actions/ui';
import { projectOpen } from '../actions/projects';
import { getLocal, setLocal } from '../utils/localstorage';

import '../styles/LandingPage.css';

const allowedModals = ['signin', 'register', 'account', 'reset', 'forgot'];

export class LandingPage extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    location: PropTypes.shape({
      query: PropTypes.object,
    }).isRequired,
    params: PropTypes.shape({
      comp: PropTypes.oneOf(allowedModals),
    }),
    user: PropTypes.object,
  };

  // truthy if the cookie warning must be shown
  static showCookieWarning() {
    return !getLocal('cookie-warning', false);
  }

  static isIE() {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');
    return msie > 0 || !!navigator.userAgent.match(/Trident.*rv:11\./);
  }

  static onMessageHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    if (LandingPage.isIE()) {
      if (heap && heap.track) {
        heap.track('IE_User');
      }
      this.props.uiSetGrunt('Sorry we do not currently support Internet Explorer. We recommend the Chrome browser from Google.');
      return;
    }

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
      heap.track('Register_Interest', data);
    }

    let { modalType, accountType } = data;
    if (allowedModals.indexOf(modalType) < 0) {
      modalType = 'register';
    }
    if (['free', 'paid'].indexOf(accountType) < 0) {
      accountType = 'free';
    }
    const params = modalType === 'register' ?
      { registerType: accountType } :
      null;

    dispatch(uiShowAuthenticationForm(modalType, params));
  }

  state = {
    showCookieWarning: LandingPage.showCookieWarning(),
  };

  componentDidMount() {
    const authForm = this.props.params.comp;

    if (authForm === 'landing') {
      //do nothing, fall through
    } else if (authForm) {
      this.props.uiShowAuthenticationForm(authForm);
    } else if (this.props.user && this.props.user.userid && (this.props.location.query && !this.props.location.query.noredirect)) {
      // if not showing an auth form goto most recent project or demo project
      // NOTE: the nodirect query string prevents redirection

      // revisit last project
      this.props.projectOpen(null, true);
      return;
    }

    window.addEventListener('message', LandingPage.onMessageHandler, false);
  }

  componentWillUnmount() {
    window.removeEventListener('message', LandingPage.onMessageHandler);
  }

  /**
   * used is closing the cookie warnig so update local storage as seen
   */
  cookieWarningClosed = () => {
    setLocal('cookie-warning', 'acknowledged');
    this.setState({
      showCookieWarning: false,
    });
  };

  render() {
    //todo - need to show the cookie warning? or do it in the iframe

    return (
      <iframe
        id="LandingPageFrame"
        ref={(el) => { this.iframe = el; }}
        sandbox="allow-same-origin allow-scripts"
        className="LandingPage"
        src="/landing_page_content/index.html"
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
  uiSetGrunt,
  projectOpen,
})(LandingPage);

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

import { uiShowAuthenticationForm } from '../actions/ui';
import { projectOpen } from '../actions/projects';

import '../styles/LandingPage.css';

const allowedModals = ['signin', 'register', 'account', 'reset', 'forgot'];

export class LandingPage extends Component {
  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    location: PropTypes.shape({
      query: PropTypes.object,
    }).isRequired,
    params: PropTypes.shape({
      comp: PropTypes.oneOf(allowedModals),
    }),
    user: PropTypes.object,
  };

  static isIE() {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf('MSIE ');
    return msie > 0 || !!navigator.userAgent.match(/Trident.*rv:11\./);
  }

  componentDidMount() {
    //determine whether to show a modal, or go to project page

    const authForm = this.props.params.comp;
    const haveUser = this.props.user && this.props.user.userid;
    const { query } = this.props.location;
    const redirectOk = query && !query.noredirect;

    //if they close the modal, send them to the landing page... they didn't go through the process
    const authFormParams = {
      onClose: () => {
        window.location = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
      },
    };

    if (authForm && allowedModals.indexOf(authForm) >= 0) {
      if (authForm === 'register') {
        authFormParams.accountType = (query && query.accountType) ? query.accountType : 'free';
      }
      this.props.uiShowAuthenticationForm(authForm, authFormParams);
    } else if (haveUser && redirectOk) {
      // revisit last project
      this.props.projectOpen(null, true);
    } else {
      this.props.uiShowAuthenticationForm('register', authFormParams);
    }
  }

  render() {
    return (
      <div className="LandingPage" />
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
  projectOpen,
})(LandingPage);

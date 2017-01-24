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
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { uiShowAuthenticationForm } from '../actions/ui';
import AccountForm from '../components/authentication/account';
import ModalWindow from '../components/modal/modalwindow';

//new auth modals
import SignInModal from '../components/authentication/SignInModal';
import RegisterModal from '../components/authentication/RegisterModal';
import ForgotModal from '../components/authentication/ForgotModal';
import ResetModal from '../components/authentication/ResetModal';

import '../styles/authenticationforms.css';
import '../../src/styles/form.css';

const nameMap = {
  register: 'Sign Up',
  signin: 'Sign In',
  forgot: 'Forgot Password',
  reset: 'Reset Password',
  account: 'Account Information',
};

function AuthenticationModals(props) {
  let oldform;
  let form;

  //new ones
  //todo - should convert these to forms, and wrap in modal ourselves
  switch (props.authenticationForm) {
    case 'register' :
      form = <RegisterModal />;
      break;
    case 'signin':
      form = <SignInModal />;
      break;
    case 'forgot':
      form = <ForgotModal />;
      break;
    case 'reset' :
      form = <ResetModal />;
      break;
    default:
  }

  //handle the old modals
  switch (props.authenticationForm) {
    case 'account' :
      oldform = <AccountForm />;
      break;
    default:
      oldform = null;
      break;
  }

  return !form
    ?
    null
    :
    <ModalWindow
      open
      title="Auth Modal"
      payload={form}
      closeOnClickOutside
      closeModal={(buttonText) => {
        props.uiShowAuthenticationForm('none');
      }}
    />;
}

AuthenticationModals.propTypes = {
  uiShowAuthenticationForm: PropTypes.func.isRequired,
  authenticationForm: PropTypes.string,
};

function mapStateToProps(state) {
  return {
    authenticationForm: state.ui.modals.authenticationForm,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
})(AuthenticationModals);

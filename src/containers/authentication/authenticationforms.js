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

import '../../../src/styles/authenticationforms.css';
import '../../../src/styles/form.css';
import { uiShowAuthenticationForm } from '../../actions/ui';
import AccountForm from '../../components/authentication/account';
import ForgotForm from '../../components/authentication/forgot';
import RegisterFormNew from '../../components/authentication/RegisterNew';
import ResetForm from '../../components/authentication/reset';
import SignInForm from '../../components/authentication/signin';
import ModalWindow from '../../components/modal/modalwindow';

function AuthenticationForms(props) {
  let form;

  //new ones
  switch (props.authenticationForm) {
    case 'register' :
      return <RegisterFormNew />;
    default:
  }

  //handle the old modals
  switch (props.authenticationForm) {
    case 'signin' :
      form = <SignInForm />;
      break;
    case 'forgot' :
      form = <ForgotForm />;
      break;
    case 'reset' :
      form = <ResetForm />;
      break;
    case 'account' :
      form = <AccountForm />;
      break;
    default:
      form = null;
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

AuthenticationForms.propTypes = {
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
})(AuthenticationForms);

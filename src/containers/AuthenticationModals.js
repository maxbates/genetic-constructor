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

//old forms
import AccountForm from '../components/authentication/account';
import ModalWindow from '../components/modal/modalwindow';

//new auth modals
import Modal from '../components/modal/Modal';
import SignInForm from '../components/authentication/SignInForm';
import RegisterForm from '../components/authentication/RegisterForm';
import ForgotForm from '../components/authentication/ForgotForm';
import ResetForm from '../components/authentication/ResetForm';

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
  if (props.authenticationForm === 'none') {
    return null;
  }

  let oldform;
  let form;

  //new ones
  switch (props.authenticationForm) {
    case 'register' :
      form = <RegisterForm />;
      break;
    case 'signin':
      form = <SignInForm />;
      break;
    case 'forgot':
      form = <ForgotForm />;
      break;
    case 'reset' :
      form = <ResetForm />;
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

  const onClose = () => {
    //trigger this first, since it will be cleared after form set to 'none'
    if (props.authFormParams.onClose) {
      props.authFormParams.onClose();
    }
    props.uiShowAuthenticationForm('none');
  };

  return form
    ?
      <Modal
        isOpen={!!form}
        onClose={onClose}
        title={nameMap[props.authenticationForm]}
        style={{ content: { width: '740px' } }}
      >
        {form}
      </Modal>
    :
      <ModalWindow
        open
        title="Auth Modal"
        payload={oldform}
        closeOnClickOutside
        closeModal={(buttonText) => {
          props.uiShowAuthenticationForm('none');
        }}
      />;
}

AuthenticationModals.propTypes = {
  uiShowAuthenticationForm: PropTypes.func.isRequired,
  authenticationForm: PropTypes.string,
  authFormParams: PropTypes.shape({ //eslint-disable-line react/no-unused-prop-types
    onClose: PropTypes.func,
  }),
};

function mapStateToProps(state) {
  return {
    authenticationForm: state.ui.modals.authenticationForm,
    authFormParams: state.ui.modals.authFormParams,
  };
}

export default connect(mapStateToProps, {
  uiShowAuthenticationForm,
})(AuthenticationModals);

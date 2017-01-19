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

import { uiShowAuthenticationForm, uiSpin } from '../../actions/ui';
import { userLogin } from '../../actions/user';
import { projectOpen } from '../../actions/projects';
import { passwordValidator, errorMessageDefault } from './_validation';
import { reset } from '../../middleware/auth';

import Modal from '../Modal';
import ModalFooter from '../ModalFooter';
import FormGroup from '../formElements/FormGroup';
import FormPassword from '../formElements/FormPassword';

export class ResetModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    userLogin: PropTypes.func.isRequired,
  };

  // return a hash of the query strings
  static getQueryStrings() {
    const decode = str => decodeURIComponent(str.replace(/\+/g, ' '));
    const queryString = location.search.substring(1);
    const keyValues = queryString.split('&');

    return keyValues.reduce((acc, keyval) => {
      const [key, val] = keyval.split('=');
      if (!key || !val) {
        return acc;
      }
      return Object.assign(acc, { [decode(key)]: decode(val) });
    }, {});
  }

  // return a single named parameter from the query string
  static getParameter(name) {
    return ResetModal.getQueryStrings()[name];
  }

  state = {
    password: '',
    passwordDirty: false,
    submitError: null,
  };

  onPasswordBlur = evt => this.setState({ passwordDirty: true });
  onPassword = evt => this.setState({
    passwordDirty: false,
    password: evt.target.value,
  });

  onSubmit = (evt) => {
    evt.preventDefault();

    if (passwordValidator(this.state.password)) {
      return;
    }

    reset(ResetModal.getParameter('e'), ResetModal.getParameter('h'), this.state.password)
    .then((json) => {
      //if message is on the repsonse, there was an error
      if (json.message) {
        return Promise.reject(json);
      }

      this.props.uiSetGrunt('Your password has been reset');

      //log them in since we have their email and password
      return this.props.userLogin(ResetModal.getParameter('e'), this.state.password)
      .then(() => {
        // close the form
        this.props.uiShowAuthenticationForm('none');
        this.props.projectOpen(null);
      })
      .catch(() => {
        // if the sign in failed just redirect to sign in
        this.props.uiShowAuthenticationForm('signin');
      });
    })
    .catch((err) => {
      const { message } = err;
      this.setState({ submitError: message || errorMessageDefault });
    });
  };

  actions = [{
    text: 'Reset',
    disabled: () => !!passwordValidator(this.state.password),
    onClick: this.onSubmit,
  }];

  render() {
    const showPasswordError = this.state.passwordDirty && this.state.password && passwordValidator(this.state.password);
    const passwordError = showPasswordError ? passwordValidator(this.state.password) : '';

    return (
      <Modal
        isOpen={this.props.isOpen}
        onClose={() => this.props.uiShowAuthenticationForm('none')}
        title="Reset Password"
        style={{ content: { width: '740px' } }}
      >
        <form
          id="auth-reset"
          action="#"
          className="Form Modal-paddedContent"
          onSubmit={this.onSubmit}
        >
          <FormGroup
            label="New Password"
            error={passwordError}
          >
            <FormPassword
              value={this.state.password}
              placeholder="8 or more characters. No spaces."
              onChange={this.onPassword}
              onBlur={this.onPasswordBlur}
            />
          </FormGroup>

          {this.state.submitError && (
            <div className="Form-errorMessage">
              {this.state.submitError}
            </div>
          )}
        </form>

        <ModalFooter actions={this.actions} />
      </Modal>
    );
  }
}

export default connect(state => ({
  isOpen: state.ui.modals.authenticationForm === 'reset',
}), {
  uiShowAuthenticationForm,
  uiSpin,
  userLogin,
  projectOpen,
})(ResetModal);

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

import { uiShowAuthenticationForm, uiSetGrunt } from '../../actions/ui';
import { forgot } from '../../middleware/auth';

import Modal from '../modal/Modal';
import ModalFooter from '../modal/ModalFooter';
import FormGroup from '../formElements/FormGroup';
import FormText from '../formElements/FormText';

export class RegisterFormNew extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    submitError: null,
  };

  onEmail = evt => this.setState({ email: evt.target.value });

  onForgot(evt) {
    evt.preventDefault();

    if (!this.state.email) {
      return;
    }

    return forgot(this.state.email)
    .then((json) => {
      //handle errors by diverting to catch
      if (json.message === 'Invalid email' || json.message === 'missing email') {
        return Promise.reject(json);
      }

      this.props.uiSetGrunt(`Check Email: A link to reset your password has been sent to ${this.state.email}`);
      this.props.uiShowAuthenticationForm('none');
    })
    .catch((reason) => {
      // unrecognized email throws an exception, but we don't want the caller to know if the email is registered or not.
      if (reason && reason.message === 'Invalid email') {
        this.setState({
          submitError: 'Unrecognized email address',
        });
      } else {
        const defaultMessage = 'Unexpected error, please check your connection';
        this.setState({
          submitError: defaultMessage,
        });
      }
    });
  }

  actions = [{
    text: 'Send Request',
    disabled: () => !(this.state.email),
    onClick: this.onForgot,
  }];

  render() {
    return (
      <Modal
        isOpen={this.props.isOpen}
        onClose={() => this.props.uiShowAuthenticationForm('none')}
        title="Forgot Password"
        style={{ content: { width: '740px' } }}
      >
        <form
          id="auth-forgot"
          className="Form Modal-paddedContent"
          onSubmit={this.onForgot}
        >
          <div className="Modal-banner">
            <span>Remember your password? </span>
            <a onClick={() => this.props.uiShowAuthenticationForm('signin')}>Sign In...</a>
          </div>

          <FormGroup label="Email">
            <FormText
              value={this.state.email}
              placeholder="Email Address"
              onChange={this.onEmail}
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
  isOpen: state.ui.modals.authenticationForm === 'forgot',
}), {
  uiShowAuthenticationForm,
  uiSetGrunt,
})(RegisterFormNew);

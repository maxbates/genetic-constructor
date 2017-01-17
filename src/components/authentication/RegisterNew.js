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
import queryString from 'query-string';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { projectOpen } from '../../actions/projects';
import { uiShowAuthenticationForm, uiSpin } from '../../actions/ui';
import { userRegister } from '../../actions/user';
import { privacy, tos } from '../../utils/ui/uiapi';

import Modal from '../Modal';
import ModalFooter from '../ModalFooter';
import FormGroup from '../formElements/FormGroup';
import Checkbox from '../formElements/Checkbox';
import Captcha from '../formElements/Captcha';
import FormRadio from '../formElements/FormRadio';
import FormText from '../formElements/FormText';
import FormPassword from '../formElements/FormPassword';

//This component replaces the previous REgistration form. will deprecate prior one once complete

//todo - handle server errors

export class RegisterFormNew extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    registerType: PropTypes.string,
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSpin: PropTypes.func.isRequired,
    userRegister: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
  };

  //get the configuration from the URL, to configure how the user is onboarded
  static getConfig(formState) {
    const params = queryString.parse(window.location.search);
    const { projects, extensions } = params;

    //track the type of account they created
    //todo - support on server
    const config = {
      accountType: formState.accountType,
    };

    if (projects) {
      const projectNames = projects.split(',');
      config.projects = projectNames.reduce((acc, projectName) => Object.assign(acc, { [projectName]: {} }), {});
      Object.assign(config.projects[projectNames[0]], { default: true });
    }

    if (extensions) {
      config.extensions = extensions.split(',').reduce((acc, projectName) => Object.assign(acc, { [projectName]: { active: true } }), {});
    }

    return config;
  }

  static validateForm(formState) {
    return (
      formState.firstName &&
      formState.lastName &&
      formState.email && !emailValidator(formState.email) &&
      formState.password && !passwordValidator(formState.password) &&
      formState.accountType &&
      formState.verification &&
      formState.legal
    );
  }

  constructor(props) {
    super(props);

    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      emailDirty: false,
      password: '',
      passwordDirty: false,
      accountType: props.registerType,
      verification: false,
      legal: false,
      submitError: null,
      forceDisabled: false,
    };

    this.actions = [{
      text: 'Sign Up',
      disabled: () => (
        !this.state.forceDisabled &&
        !RegisterFormNew.validateForm(this.state)
      ),
      onClick: () => this.registerUser(this.state),
    }];
  }

  //special handling for 'darwin magic' dummy user
  onFirstName = evt => {
    if (evt.target.value === 'darwin magic') {
      this.setState({
        firstName: 'Charles',
        lastName: 'Darwin',
        email: `charlesdarwin_${Date.now()}@royalsociety.co.uk`,
        password: 'abc123',
        accountType: 'free',
        verification: true,
        legal: true,
      });
      return;
    }
    this.setState({ firstName: evt.target.value });
  };

  onLastName = evt => this.setState({ lastName: evt.target.value });

  onEmailBlur = evt => this.setState({ emailDirty: true });
  onEmail = evt => this.setState({
    emailDirty: false,
    email: evt.target.value,
  });

  onPasswordBlur = evt => this.setState({ passwordDirty: true });
  onPassword = evt => this.setState({
    passwordDirty: false,
    password: evt.target.value,
  });

  onAccountTypeChange = accountType => this.setState({ accountType });

  onCaptcha = isVerified => this.setState({ verification: isVerified });

  onLegalCheck = isChecked => this.setState({ legal: isChecked });

  registerUser(formState) {
    this.props.uiSpin('Creating your account... Please wait.');
    this.props.userRegister({
      email: formState.email,
      password: formState.password,
      firstName: formState.firstName,
      lastName: formState.lastName,
    }, RegisterFormNew.getConfig(formState))
    .then((json) => {
      // close the form / wait message
      this.props.uiSpin();
      this.props.uiShowAuthenticationForm('none');
      this.props.projectOpen(null, true);
    })
    .catch((reason) => {
      this.props.uiSpin();
      const defaultMessage = 'Unexpected error, please check your connection';

      if (reason.type === 'unique violation') {
        this.setState({
          forceDisabled: true,
          submitError: 'This email address is already registered.',
        });
      } else {
        this.setState({
          submitError: reason.message || defaultMessage,
        });
      }
    });
  }

  render() {
    //special dirty-state handling for password and email
    const showPasswordError = this.state.passwordDirty && this.state.password && passwordValidator(this.state.password);
    const showEmailError = this.state.emailDirty && this.state.email && emailValidator(this.state.email);

    const passwordError = showPasswordError ? passwordValidator(this.state.password) : '';
    const emailError = showEmailError ? emailValidator(this.state.email) : '';

    return (
      <Modal
        isOpen={this.props.isOpen}
        onClose={() => this.props.uiShowAuthenticationForm('none')}
        title="Sign Up"
        style={{ content: { width: '740px' } }}
      >
        <div className="Form Modal-paddedContent">
          <div className="Modal-banner">
            <span>Already have a Genetic Constructor account? </span>
            <a onClick={() => this.props.uiShowAuthenticationForm('signin')}>Sign In...</a>
          </div>

          <FormGroup
            label="Full Name"
          >
            <FormText
              value={this.state.firstName}
              placeholder="First Name"
              onChange={this.onFirstName}
            />
            <FormText
              value={this.state.lastName}
              placeholder="Last Name"
              onChange={this.onLastName}
            />
          </FormGroup>

          <FormGroup
            label="Email"
            error={emailError}
          >
            <FormText
              value={this.state.email}
              placeholder="Email Address"
              onChange={this.onEmail}
              onBlur={this.onEmailBlur}
            />
          </FormGroup>

          <FormGroup
            label="Password"
            error={passwordError}
          >
            <FormPassword
              value={this.state.password}
              placeholder="Password"
              onChange={this.onPassword}
              onBlur={this.onPasswordBlur}
            />
          </FormGroup>

          <FormGroup
            label="Account Type"
            labelTop
          >
            <div data-why="vertical-override-flex-row">
              <FormRadio
                checked={this.state.accountType === 'free'}
                name="accountType"
                value="free"
                onChange={() => this.onAccountTypeChange('free')}
                label="Academic - Unlimited, free access"
              />
              <FormRadio
                checked={this.state.accountType === 'paid'}
                name="accountType"
                value="paid"
                onChange={() => this.onAccountTypeChange('paid')}
                label="Individual - Unlimited free trial during BETA"
              />
              <FormRadio
                checked={false}
                name="accountType"
                value="enterprise"
                onChange={() => {}}
                label="Enterprise - My company has an account"
                disabled
              />
            </div>
          </FormGroup>

          <FormGroup
            label="Verification"
            labelTop
          >
            <Captcha onVerify={this.onCaptcha} />
          </FormGroup>

          <FormGroup
            label="Legal"
          >
            <div>
              <Checkbox
                style={{ fontSize: '18px', marginLeft: '0' }}
                checked={this.state.legal}
                onChange={this.onLegalCheck}
              />
              <span style={{ marginLeft: '0.5em' }}>
              I agree to the&nbsp;
                <a
                  href={tos}
                  target="_blank"
                  rel="noopener noreferrer"
                >Terms of Service</a>
                &nbsp;and&nbsp;
                <a
                  href={privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                >Autodesk Privacy Statement</a>
              </span>
            </div>
          </FormGroup>

          {this.state.submitError && (
            <div className="Form-errorMessage">
              {this.state.submitError}
            </div>
          )}
        </div>

        <ModalFooter actions={this.actions} />
      </Modal>
    );
  }
}

export default connect(state => ({
  isOpen: state.ui.modals.authenticationForm === 'register',
  registerType: state.ui.modals.authFormParams.registerType,
}), {
  uiShowAuthenticationForm,
  uiSpin,
  userRegister,
  projectOpen,
})(RegisterFormNew);

//error handling functions

//returns string if error
function emailValidator(email) {
  if (!email) {
    return 'Email is required';
  } else if (!(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))) {
    return 'Please enter a valid email address';
  }
}

//return string if error
function passwordValidator(password) {
  if (!password) {
    return 'Password is required';
  } else if (password.length < 6) {
    return 'Password must be 6 of more characters';
  } else if (!(/[0-9]/.test(password) && /[a-zA-Z]/.test(password))) {
    return 'Numbers and letters are required';
  }
}

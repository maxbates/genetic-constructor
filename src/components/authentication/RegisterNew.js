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
import invariant from 'invariant';
import queryString from 'query-string';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { projectOpen } from '../../actions/projects';
import { uiShowAuthenticationForm, uiSpin } from '../../actions/ui';
import { userRegister } from '../../actions/user';
import track from '../../analytics/ga';
import { privacy, tos } from '../../utils/ui/uiapi';

import Modal from '../Modal';
import FormGroup from '../formElements/FormGroup';
import Checkbox from '../formElements/Checkbox';
import Captcha from '../formElements/Captcha';
import FormRadio from '../formElements/FormRadio';

//This component replaces the previous REgistration form. will deprecate once complete

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
  static getConfig() {
    const params = queryString.parse(window.location.search);
    const { projects, extensions } = params;
    const config = {};

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
      formState.email && //todo - validate
      formState.password && //todo - validate
      formState.accountType &&
      formState.verification &&
      formState.legal
    );
  }

  static registerUser(formState) {
    console.log(formState);
    //todo
  }

  constructor(props) {
    super(props);

    this.actions = [{
      text: 'Sign Up',
      disabled: () => !RegisterFormNew.validateForm(this.state),
      onClick: () => RegisterFormNew.registerUser(this.state),
    }];

    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      accountType: props.registerType,
      verification: false,
      legal: false,
    };
  }

  onAccountTypeChange = accountType => this.setState({ accountType });

  onCaptcha = isVerified => this.setState({ verification: isVerified });

  onLegalCheck = evt => this.setState({ legal: evt.target.value });

  render() {
    //todo - show validation

    return (
      <Modal
        isOpen={this.props.isOpen}
        onClose={() => this.props.uiShowAuthenticationForm('none')}
        actions={this.actions}
        title="Sign Up"
        style={{ content: { width: '740px' } }}
      >
        <div className="Modal-banner">
          <span>Already have a Genetic Constructor account? </span>
          <a onClick={() => this.props.uiShowAuthenticationForm('signin')}>Sign In...</a>
        </div>

        <FormGroup label="Account Type">
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
        </FormGroup>

        <FormGroup label="Verification" error="There is an error!">
          <Captcha onVerify={this.onCaptcha} />
        </FormGroup>

        <FormGroup label="Legal">
          <Checkbox
            checked={this.state.legal}
            onChange={this.onLegalCheck}
          />
        </FormGroup>

      </Modal>
    );
  }
}

//todo - verify isOpen always set to false, even if auth form component is rendering this
//need to ensure the modal is always closed properly

export default connect(state => ({
  isOpen: state.ui.modals.authenticationForm === 'register',
  registerType: state.ui.modals.authFormParams.registerType,
}), {
  uiShowAuthenticationForm,
  uiSpin,
  userRegister,
  projectOpen,
})(RegisterFormNew);

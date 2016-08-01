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
import GlobalNav from './GlobalNav';
import AuthenticationForms from './authentication/authenticationforms';
import ImportGenBankModal from '../components/genbank/import';
import ImportDNAForm from '../components/importdna/importdnaform';
import AboutForm from '../components/aboutform';
import OrderModal from '../containers/orders/ordermodal';
import ModalSpinner from '../components/modal/modalspinner';
import SaveErrorModal from '../components/modal/SaveErrorModal';
import ReportErrorModal from '../components/modal/ReportErrorModal';
import track from '../analytics/ga';

import '../styles/App.css';

class App extends Component {
  static propTypes = {
    children: PropTypes.node, // Injected by React Router
    user: PropTypes.object,
    currentProjectId: PropTypes.string,
    location: PropTypes.shape({
      pathname: PropTypes.string.isRequired,
    }).isRequired,
  };

  /**
   * attempt to eat backspace keys ( to prevent navigation ) unless an interactive
   * element is the target
   */
  componentDidMount() {
    document.addEventListener('keydown', this.rejectBackspace);
    document.addEventListener('keypress', this.rejectBackspace);
    // track top level, unhandled exceptions in the app
    window.onerror = function() {
      const a = Array.from(arguments);
      const json = {};
      a.forEach((arg, index) => {
        // we except strings as arguments or stringable object. toString ensures
        // things like functions won't cause problems with JSON.stringify
        json[index] = arg.toString();
      });
      const str = JSON.stringify(json, null, 2);
      track('Errors', 'Unhandled Exception', str);

      // rethrow the error :(
      throw new Error(arguments[0]);
    }
  }

  rejectBackspace(evt) {
    const rx = /INPUT|SELECT|TEXTAREA/i;
    if (evt.which === 8) { // 8 == backspace
      if (evt.target.hasAttribute('contenteditable')) {
        return;
      }
      if (!rx.test(evt.target.tagName) || evt.target.disabled || evt.target.readOnly) {
        evt.preventDefault();
      }
    }
  }

  render() {
    const DevTools = (!!process.env.DEBUGMODE) ? require('./DevTools') : 'noscript';
    const onProjectPage = this.props.location.pathname.indexOf('project/') >= 0;

    return (
      <div className="App">
        <GlobalNav currentProjectId={this.props.currentProjectId}
                   showMenu={onProjectPage}/>
        <AuthenticationForms />
        <ImportGenBankModal currentProjectId={this.props.currentProjectId}/>
        <ImportDNAForm />
        <AboutForm />
        <SaveErrorModal />
        <ReportErrorModal />
        <OrderModal projectId={this.props.currentProjectId} />
        <div className="App-pageContent">
          {this.props.children}
        </div>
        <ModalSpinner spinMessage={this.props.spinMessage}/>
        <DevTools />
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    currentProjectId: ownProps.params.projectId,
    user: state.user,
    spinMessage: state.ui.modals.spinMessage,
  };
}

export default connect(mapStateToProps, {})(App);

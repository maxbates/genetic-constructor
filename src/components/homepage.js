import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux';
import { uiShowAuthenticationForm, uiSetGrunt } from '../actions/ui';
import '../styles/homepage.css';
import { getItem, setItem } from '../middleware/localStorageCache';

export default class HomePage extends Component {

  static propTypes = {
    uiShowAuthenticationForm: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
  };

  constructor() {
    super();
  }

  // this route can result from path like 'homepage/signin', 'homepage', 'homepage/register' etc.
  // If the final path is the name of an authorization form we will show it
  componentDidMount() {
    if (this.props.user && this.props.user.userid) {
      // revisit last project or test project if user is logged in
      this.props.push(`/project/${getItem('mostRecentProject') || 'test'}`);
      return;
    }
    const authForm = window.location.pathname.split('/').pop();
    if (['signin', 'signup', 'account', 'reset', 'forgot'].indexOf(authForm) >= 0) {
      this.props.uiShowAuthenticationForm(authForm);
    }
  }

  signIn(evt) {
    evt.preventDefault();
    this.props.uiShowAuthenticationForm('signin');
  }

  render() {
    return (
      <div className="homepage">
        <img className="homepage-background" src="/images/homepage/background.png"/>
        <img className="homepage-title" src="/images/homepage/genomedesigner.png"/>
        <img className="homepage-autodesk" src="/images/homepage/autodesk-logo.png"/>
        <div className="homepage-getstarted" onClick={this.signIn.bind(this)}>Get started</div>
        <div className="homepage-footer">
          <div className="homepage-footer-list">New in version 0.1:
            <ul>
              <li><span>&bull;</span>Search and import parts directly from the IGEM and NCBI databases.</li>
              <li><span>&bull;</span>Specify parts from the Edinburgh Genome Foundry inventory.</li>
              <li><span>&bull;</span>Import and export GenBank and FASTA files.</li>
              <li><span>&bull;</span>Create an inventory of your own projects, constructs and parts to reuse.</li>
              <li><span>&bull;</span>Drag and drop editing.</li>
              <li><span>&bull;</span>Inspect sequence detail.</li>
              <li><span>&bull;</span>Create nested constructs to manage complexity.</li>
              <li><span>&bull;</span>Assign SBOL visual symbols and colors.</li>
              <li><span>&bull;</span>Add titles and descriptions blocks, constructs and projects.</li>
              <li><span>&bull;</span>Organize constructs into separate projects.</li>
            </ul>
          </div>
        </div>
      </div>
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
  push,
})(HomePage);
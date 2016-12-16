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
import Switch from '../ui/Switch';
import registry from '../../extensions/clientRegistry';
import {
  extensionName,
  extensionAuthor,
  extensionRegion,
  extensionType,
  extensionDescription,
  manifestIsClient,
  manifestIsServer,
} from '../../../server/extensions/manifestUtils';
import { userUpdateConfig } from '../../actions/user';
import Expando from '../ui/Expando';

import {
  uiSetGrunt,
} from '../../actions/ui';

import '../../styles/InspectorGroupExtensions.css';


class InspectorGroupExtensions extends Component {
  static propTypes = {
    config: PropTypes.object.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    userUpdateConfig: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {};
  }


  /**
   * there is a delay loading extensions when the app starts. if we find none
   * then update a 2 seconds intervals until we do.
   */
  componentDidMount() {
    this.expectExtensions();
  }

  componentDidUpdate() {
    this.expectExtensions();
  }

  checkExtensionActive = (extension) => {
    return this.props.config.extensions[extension] && this.props.config.extensions[extension].active;
  };

  extensionToggled = (extensionName) => {
    const update = Object.assign({}, this.props.config, {
      extensions: {
        [extensionName]: {
          active: !this.checkExtensionActive(extensionName),
        },
      },
    });
    this.props.userUpdateConfig(update)
    .then(() => {
      this.forceUpdate();
    });
  };

  expectExtensions() {
    if (Object.keys(registry).length === 0) {
      setTimeout(() => {
        this.forceUpdate();
      }, 2000);
    }
  }

  render() {
    return (<div className="InspectorGroupExtensions">
      {Object.keys(registry).map(key => registry[key]).map((extension, index) => {
        const values = {
          Name: extensionName(extension),
          Type: extensionType(extension),
          Description: extensionDescription(extension),
          Author: extensionAuthor(extension),
          Client: manifestIsClient(extension),
          isServer: manifestIsServer(extension),
          Region: extensionRegion(extension),
        };
        return (<Expando
          openByDefault
          key={index}
          text={values.Name}
          headerWidgets={[
            (<Switch
              key={index}
              on={this.checkExtensionActive(extension.name)}
              switched={this.extensionToggled.bind(this, extension.name)}
            />),
          ]}
          content={
            <div className="content-dropdown">
              <div className="row">
                <div className="key">Type</div>
                <div className="value">{values.Type}</div>
              </div>
              <div className="row">
                <div className="key">Description</div>
                <div className="value">{values.Description}</div>
              </div>
              <div className="row">
                <div className="key">Author</div>
                <div className="value">{values.Author.name ? values.Author.name + '\n' + values.Author.email : values.Author}</div>
              </div>
            </div>
          }
        />);
      })}
    </div>);
  }
}

function mapStateToProps(state, props) {
  return {
    config: state.user.config,
  };
}

export default connect(mapStateToProps, {
  uiSetGrunt,
  userUpdateConfig,
})(InspectorGroupExtensions);


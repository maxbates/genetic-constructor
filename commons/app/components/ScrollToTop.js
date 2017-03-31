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
import React, { PropTypes, Component } from 'react';
import { withRouter } from 'react-router';

class ScrollToTop extends Component {
  static propTypes = {
    location: PropTypes.object, //maybe not available in server
    children: PropTypes.node.isRequired,
  }

  componentDidUpdate(prevProps) {
    if (process.env.BROWSER) {
      if (this.props.location && (this.props.location !== prevProps.location)) {
        window.scrollTo(0, 0);
      }
    }
  }

  render() {
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);

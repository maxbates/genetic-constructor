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
import '../../../src/styles/inline-toolbar.css';

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
class InlineToolbar extends Component {
  static propTypes = {
    /*
        text: "Blah",
        imageURL: "/images/blah.svg",
        enabled: true,
        clicked: () => {},
     */
    items: PropTypes.array.isRequired,
  };

  itemClicked = (item) => {
    if (item.enabled) {
      item.clicked();
    }
  };

  render() {
    return (
      <div className="inline-toolbar">
        {
          this.props.items.slice().reverse().map((item, index) =>
            (
              <img
                key={index}
                title={item.text}
                src={item.imageURL}
                onClick={() => this.itemClicked(item)}
                className="item"
                style={{
                  filter: `brightness(${item.enabled ? '100%' : '50%'})`,
                }}
              />
            ))
        }
      </div>
    );
  }

}

function mapStateToProps(state, props) {
  return {
  };
}

export default connect(mapStateToProps, {

})(InlineToolbar);

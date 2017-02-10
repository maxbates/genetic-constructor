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
import ReactDOM from 'react-dom';
import MouseTrap from '../../containers/graphics/mousetrap';
import '../../../src/styles/title-and-toolbar.css';
import InlineToolbar from './inline-toolbar';

/*
  Displays a title and sub title ( different color ) along with
  a collapsing toolbar that shrinks in preference to the title.
  The construct title and product title both use this component.
 */

/**
 * modal window with user supplied payload and user defined ( optional )
 * buttons. The property this.props.closeModal is called when the modal is closed.
 * If the modal was closed via a button the button text is supplied.
 *
 */
class TitleAndToolbar extends Component {
  static propTypes = {
    toolbarItems: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string,
    fontSize: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func,
    noHover: PropTypes.bool,
    itemActivated: PropTypes.func,
    readOnly: PropTypes.bool,
  };

  /**
   * run a mouse trap instance to get context menu events
   */
  componentDidMount() {
    const self = ReactDOM.findDOMNode(this);
    // mouse trap is used for coordinate transformation
    this.mouseTrap = new MouseTrap({
      element: self,
      contextMenu: this.onContextMenu,
    });
  }

  componentWillUnmount() {
    this.mouseTrap.dispose();
    this.mouseTrap = null;
  }

  onContextMenu = (mouseEvent, position) => {
    if (this.props.onContextMenu) {
      this.props.onContextMenu(this.mouseTrap.mouseToGlobal(mouseEvent));
    }
  };

  render() {
    const disabledProp = {
      disabled: !!this.props.noHover,
    };
    return (
      <div className="title-and-toolbar">
        <div
          className="title"
          {...disabledProp}
          style={{ fontSize: this.props.fontSize, color: this.props.color }}
          onClick={this.props.onClick}
        >
          <div
            className="text"
            data-id={this.props.title}
          >{this.props.title}
            <span>{this.props.subTitle}</span>
          </div>
          <img src="/images/ui/edit.svg" />
        </div>
        <div className="bar">
          <InlineToolbar items={this.props.toolbarItems} itemActivated={this.props.itemActivated} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
  };
}

export default connect(mapStateToProps, {

})(TitleAndToolbar);

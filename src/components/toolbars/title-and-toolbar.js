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

import MouseTrap from '../../containers/graphics/mousetrap';
import InlineToolbar from './inline-toolbar';

import '../../../src/styles/title-and-toolbar.css';

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
export default class TitleAndToolbar extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    toolbarItems: PropTypes.array,
    subTitle: PropTypes.string,
    label: PropTypes.string,
    fontSize: PropTypes.string,
    color: PropTypes.string,
    onClick: PropTypes.func,
    onClickBackground: PropTypes.func,
    onContextMenu: PropTypes.func,
    noHover: PropTypes.bool,
    itemActivated: PropTypes.func,
  };

  static defaultProps = {
    fontSize: '16px',
    color: '#3F82FF',
    onClick: () => {},
    onClickBackground: (evt) => {},
  };

  /**
   * run a mouse trap instance to get context menu events
   */
  componentDidMount() {
    // mouse trap is used for coordinate transformation
    this.mouseTrap = new MouseTrap({
      element: this.element,
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
      <div
        className="title-and-toolbar"
        onClick={this.props.onClickBackground}
        ref={(el) => { this.element = el; }}
      >
        <div
          className="title"
          {...disabledProp}
          style={{
            fontSize: this.props.fontSize,
            color: this.props.color,
            cursor: (this.props.noHover ? 'default' : 'pointer'),
          }}
          onClick={this.props.onClick}
        >
          <div
            className="text"
            data-id={this.props.title}
          >{this.props.title}
            {this.props.subTitle ? <div className="subtitle">{this.props.subTitle}</div> : null}
            {this.props.label ? <div className="label">{this.props.label}</div> : null}
          </div>
          <img src="/images/ui/edit.svg" />
        </div>

        <div className="bar">
          {(this.props.toolbarItems && this.props.toolbarItems.length) && (
            <InlineToolbar
              items={this.props.toolbarItems}
              itemActivated={this.props.itemActivated}
            />
          )}
        </div>
      </div>
    );
  }
}

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
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import Box2D from '../../containers/graphics/geometry/box2d';
import SubMenu from './SubMenu';
import { uiShowMenu } from '../../actions/ui';

import '../../../src/styles/MenuOverlay.css';
/**
 * Elements that holds the active menu and blocks access to the page behind it.
 */
class MenuOverlay extends Component {
  static propTypes = {};

  constructor() {
    super();
    this.state = {
      openLeft: true,
    }
  }

  /**
   * get the side class based on our target selector
   */
  getSideClass() {
    return this.props.menuPosition.x < document.body.clientWidth / 2
      ? 'menu-overlay-menu menu-overlay-top menu-overlay-left'
      : 'menu-overlay-menu menu-overlay-top menu-overlay-right';
  }

  /**
   * handle window resizes
   */
  componentDidMount() {
    window.addEventListener('resize', this.close);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.close);
    this.stopKillTimer();
  }


  /**
   * close by clearing out the menu items
   */
  close = () => {
    this.props.uiShowMenu();
  };

  stopKillTimer() {
    window.clearTimeout(this.killTimer);
  }
  startKillTimer() {
    this.stopKillTimer();
    this.killTimer = window.setTimeout(() => {
      this.close();
    }, 400);
  }

  mouseEnterMenu = () => {
    this.inside = true;
    this.stopKillTimer();
  };

  mouseLeaveMenu = () => {
    if (this.inside) {
      this.inside = false;
      this.startKillTimer();
    }
  };

  /**
   * mouse down in overlay, careful to ignore propagated events
   * @param evt
   */
  mouseOverlay = (evt) => {
    const el = ReactDOM.findDOMNode(this);
    if (el.isSameNode(evt.target)) {
      evt.preventDefault();
      evt.stopPropagation();
      this.close();
    }
  };

  componentWillReceiveProps() {
    this.measured = false;
  }
  /*
   * render modal dialog with owner supplied payload and optional buttons.
   */
  render() {
    // nothing if not open
    if (!this.props.menuItems) {
      return null;
    }
    const pos = this.props.menuPosition;
    // size and position pointer and menu
    const psize = 20;
    const pointerPosition = {
      width: psize + 'px',
      height: psize + 'px',
      left: pos.x - 10 + 'px',
      top: pos.y + 'px',
    };
    const menuPosition = {
      left: pos.x - 10 + 'px',
      top: pos.y + psize / 2 + 'px',
    };
    // to be called after render, react sucks
    if (!this.measured) {
      this.measured = true;
      window.setTimeout(() => {
        // determine which side to open sub menus once we have updated.
        const box = new Box2D(ReactDOM.findDOMNode(this.refs.subMenu).getBoundingClientRect());
        const openLeft = box.right > document.body.clientWidth / 2;
        if (openLeft !== this.state.openLeft) {
          this.setState({ openLeft });
        }
      }, 10);
    }

    return (
      <div
        className="menu-overlay"
        onMouseDown={this.mouseOverlay}
      >
        <div className="menu-overlay-pointer" style={pointerPosition}></div>
        <SubMenu
          menuItems={this.props.menuItems}
          position={menuPosition}
          close={this.close}
          onMouseEnter={this.mouseEnterMenu}
          onMouseLeave={this.mouseLeaveMenu}
          className={this.getSideClass()}
          openLeft={this.state.openLeft}
          ref="subMenu"
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    menuItems: state.ui.modals.menuItems,
    menuPosition: state.ui.modals.menuPosition,
  };
}
export default connect(mapStateToProps, {
  uiShowMenu,
})(MenuOverlay);

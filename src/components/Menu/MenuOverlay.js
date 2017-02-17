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

import '../../../src/styles/MenuOverlay.css';
import { uiShowMenu } from '../../actions/ui';
import SubMenu from './SubMenu';

/**
 * Elements that holds the active menu and blocks access to the page behind it.
 */
class MenuOverlay extends Component {
  static propTypes = {
    menuPosition: PropTypes.object,
    menuItems: PropTypes.array,
    uiShowMenu: PropTypes.func.isRequired,
    menuHat: PropTypes.bool,
  };

  constructor() {
    super();
    this.state = {
      openLeft: true,
    };
  }

  /**
   * handle window resizes
   */
  componentDidMount() {
    window.addEventListener('resize', this.close);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.menuItems && nextProps.menuItems.length) {
      this.setState({
        openLeft: nextProps.menuPosition.x > window.innerWidth / 2,
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.close);
    this.stopKillTimer();
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

  /*
   * render modal dialog with owner supplied payload and optional buttons.
   */
  render() {
    // nothing if not open
    if (!this.props.menuItems) {
      return null;
    }
    // length of side of arrow
    const arrow = 12;
    // required position of menu
    const pos = this.props.menuPosition;
    // true if position falls in bottom half of screen
    const bottomHalf = pos.y > window.innerHeight / 2;
    // size and position hat and menu
    const psize = this.props.menuHat ? arrow : 0;
    const pointerPosition = bottomHalf ? {
      width: `${psize}px`,
      height: `${psize}px`,
      left: `${pos.x - arrow / 2}px`,
      top: `${pos.y - psize * 4}px`,
    } : {
      width: `${psize}px`,
      height: `${psize}px`,
      left: `${pos.x - arrow / 2}px`,
      top: `${pos.y}px`,
    };
    const menuPosition = bottomHalf ? {
      left: `${pos.x - arrow / 2}px`,
      bottom: `${window.innerHeight - pos.y + psize * 3.5}px`,
    } : {
      left: `${pos.x - arrow / 2}px`,
      top: `${pos.y + psize / 2}px`,
    };

    return (
      <div
        className="menu-overlay"
        onMouseDown={this.mouseOverlay}
      >
        {this.props.menuHat
          ? <div className="menu-overlay-pointer" style={pointerPosition} />
          : null
        }
        <SubMenu
          menuItems={this.props.menuItems}
          position={menuPosition}
          close={this.close}
          onMouseEnter={this.mouseEnterMenu}
          onMouseLeave={this.mouseLeaveMenu}
          className={this.getSideClass()}
          openLeft={this.state.openLeft}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    menuItems: state.ui.modals.menuItems,
    menuPosition: state.ui.modals.menuPosition,
    menuHat: state.ui.modals.menuHat,
  };
}
export default connect(mapStateToProps, {
  uiShowMenu,
})(MenuOverlay);

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

import MouseTrap from '../../containers/graphics/mousetrap';
import Arrow from './Arrow';
import Label from './Label';
import { getLocal, setLocal } from '../../utils/localstorage';

import '../../styles/Expando.css';

export default class Expando extends Component {
  static propTypes = {
    children: PropTypes.node, //can be null
    text: PropTypes.string.isRequired,
    secondary: PropTypes.string,
    selected: PropTypes.bool, //blue text
    selectedAlt: PropTypes.bool, //grey background
    textWidgets: PropTypes.arrayOf(PropTypes.node),
    labelWidgets: PropTypes.arrayOf(PropTypes.node),
    headerWidgets: PropTypes.arrayOf(PropTypes.node),
    bold: PropTypes.bool,
    onExpand: PropTypes.func,
    onClick: PropTypes.func, // (open) => {}
    onContextMenu: PropTypes.func,
    startDrag: PropTypes.func,
    showArrowWhenEmpty: PropTypes.bool,
    showLock: PropTypes.bool,
    testid: PropTypes.string,
    openByDefault: PropTypes.bool,
    capitalize: PropTypes.bool,
    stateKey: PropTypes.string,
  };

  static defaultProps = {
    showArrowWhenEmpty: false,
  };

  constructor(props) {
    super(props);
    // initial state from local storage if we have a state key, otherwise default to openByDefault property.
    this.state = {
      open: props.stateKey ? getLocal(props.stateKey, !!props.openByDefault, true) : !!props.openByDefault,
    };
  }

  componentDidMount() {
    if (this.props.startDrag) {
      this.mouseTrap = new MouseTrap({
        element: ReactDOM.findDOMNode(this.refs.label),
        mouseDrag: (event, localPosition, startPosition, distance) => {
          if (distance > 12) {
            // cancel mouse drag and start a drag and drop
            this.mouseTrap.cancelDrag();
            // get global point as starting point for drag
            const globalPoint = this.mouseTrap.mouseToGlobal(event);
            // callback to owner
            this.props.startDrag(globalPoint);
          }
        },
      });
    }
  }

  /**
   * toggle the open state and invoke the optional onExpand / onClick callbacks
   */
  onClick = () => {
    // toggle open state
    const open = !this.state.open;
    this.setState({ open });
    // store locally if stateKey present
    if (this.props.stateKey) {
      setLocal(this.props.stateKey, open, true);
    }

    // handle onExpand callback
    if (open && this.props.onExpand) {
      this.props.onExpand();
    }
    // send click event
    if (this.props.onClick) {
      this.props.onClick(open);
    }
  };

  render() {
    const showArrow = this.props.children || this.props.showArrowWhenEmpty;
    return (
      <div
        data-testid={this.props.testid}
        data-expando={this.props.text}
        className="expando"
        onContextMenu={(evt) => {
          if (process.env.NODE_ENV !== 'dev') {
            evt.preventDefault();
          }
          evt.stopPropagation();
          if (this.props.onContextMenu) {
            this.props.onContextMenu(evt);
          }
        }}
      >
        <div className="header">
          <Arrow
            direction={this.state.open ? 'down' : 'right'}
            onClick={this.onClick}
            hidden={!showArrow}
          />
          <Label
            ref="label"
            text={this.props.text}
            secondary={this.props.secondary}
            bold={this.props.bold}
            hover
            onClick={this.onClick}
            selected={this.props.selected}
            selectedAlt={this.props.selectedAlt}
            widgets={this.props.labelWidgets}
            showLock={this.props.showLock}
            textWidgets={this.props.textWidgets}
            styles={{
              marginLeft: '2px',
              marginRight: this.props.headerWidgets && this.props.headerWidgets.length ? '0.5rem' : '0',
              flexGrow: 1,
              userSelect: 'none',
              textTransform: this.props.capitalize ? 'capitalize' : 'none',
            }}
          />
          <div className="header-extras">
            {this.props.headerWidgets}
          </div>
        </div>
        <div className={this.state.open ? 'content-visible' : 'content-hidden'}>
          {this.state.open ? this.props.children : null}
        </div>
      </div>
    );
  }
}

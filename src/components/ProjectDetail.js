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
import { throttle } from 'lodash';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { detailViewSelectExtension, uiToggleDetailView } from '../actions/ui';
import { extensionsByRegion, getExtensionName, onRegister } from '../extensions/clientRegistry';
import '../styles/ProjectDetail.css';
import ExtensionView from './ExtensionView';

const projectDetailExtensionRegion = 'projectDetail';

export class ProjectDetail extends Component {
  static propTypes = {
    uiToggleDetailView: PropTypes.func.isRequired,
    detailViewSelectExtension: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    currentExtension: PropTypes.any, //todo - allow null or key
  };

  constructor() {
    super();
    this.extensions = [];
  }

  state = {
    //default open height
    openHeight: 400,
  };

  componentDidMount() {
    //listen to get relevant manifests here.
    //run on first time (key === null) in case registry is already populated.
    this.extensionsListener = onRegister((registry, key, regions) => {
      if (key === null || regions.indexOf(projectDetailExtensionRegion) >= 0) {
        this.extensions = extensionsByRegion(projectDetailExtensionRegion);
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.extensionsListener();
  }

  openExtension = (key) => {
    if (!key || key === this.props.currentExtension) {
      return;
    }

    if (!this.props.isVisible) {
      this.toggle(true);
    }

    this.props.detailViewSelectExtension(key);
  };

  /** resize things (todo - make a component that handles this) **/

  throttledDispatchResize = throttle(() => window.dispatchEvent(new Event('resize')), 50);

  handleResizableMouseDown = (evt) => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.add('dragging');
    document.addEventListener('mousemove', this.handleResizeMouseMove);
    document.addEventListener('mouseup', this.handleResizeMouseUp);
    this.dragStart = evt.pageY;
    //cringe-worthy query selector voodoo
    //leave at least 200 px in the design canvas
    this.dragMax = document.querySelector('.ProjectPage-content').getBoundingClientRect().height - 200;
    this.openStart = this.state.openHeight;
  };

  handleResizeMouseMove = (evt) => {
    evt.preventDefault();
    const delta = this.dragStart - evt.pageY;
    const minHeight = 200;
    const nextHeight = Math.min(this.dragMax, Math.max(minHeight, this.openStart + delta));
    this.setState({ openHeight: nextHeight });
    this.throttledDispatchResize();
  };

  handleResizeMouseUp = (evt) => {
    evt.preventDefault();
    this.refs.resizeHandle.classList.remove('dragging');
    this.dragStart = null;
    this.openStart = null;
    document.removeEventListener('mousemove', this.handleResizeMouseMove);
    document.removeEventListener('mouseup', this.handleResizeMouseUp);
    window.dispatchEvent(new Event('resize'));
  };

  /** end resize things **/

  handleClickToggle = (evt) => {
    if (this.props.isVisible) {
      return this.toggle(false);
    }

    this.toggle(true);
    this.openExtension(this.extensions[0]);
  };

  toggle = (forceVal) => {
    this.props.uiToggleDetailView(forceVal);
  };

  render() {
    const { isVisible, currentExtension } = this.props;
    if (!this.extensions.length) {
      return null;
    }

    if (isVisible) {
      return (
        <div className="ProjectDetail-open" style={{ height: `${this.state.openHeight}px` }}>
          <div
            ref="resizeHandle"
            className="ProjectDetail-open-resizeHandle"
            onMouseDown={this.handleResizableMouseDown}
          />
          <div className="ProjectDetail-open-header">
            {/* Left side of header, extension tabls */}
            <div className="ProjectDetail-open-header-left">
              {this.extensions.map((key) => {
                const name = getExtensionName(key);
                const active = key === currentExtension ? ' ProjectDetail-open-header-left-active' : '';
                const className = `ProjectDetail-open-header-left-extension${active}`;
                return (
                  <a
                    key={key}
                    className={className}
                    onClick={() => this.openExtension(key)}
                  >{name}
                  </a>
                );
              })}
            </div>
            {/* right side of header, toolbar and close button */}
            <div className="ProjectDetail-open-header-right">
              <a
                ref="close"
                className={'ProjectDetail-open-header-right-close'}
                onClick={() => this.toggle(false)}
              />
            </div>
          </div>
          {currentExtension && (<ExtensionView
            region={projectDetailExtensionRegion}
            isVisible
            extension={currentExtension}
          />) }
        </div>
      );
    }
    // just a list of extensions if closed
    return (
      <div className="ProjectDetail-closed">
        {this.extensions.map((key) => {
          const name = getExtensionName(key);
          return (
            <a
              key={key}
              className="ProjectDetail-closed-extension"
              onClick={() => this.openExtension(key)}
            >{name}
            </a>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { isVisible, currentExtension } = state.ui.detailView;
  return {
    isVisible,
    currentExtension,
  };
};

export default connect(mapStateToProps, {
  uiToggleDetailView,
  detailViewSelectExtension,
})(ProjectDetail);

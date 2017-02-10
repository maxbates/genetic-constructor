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

import {
  focusPrioritize,
  focusConstruct,
} from '../actions/focus';
import {
  projectRename,
  projectAddConstruct,
  projectDelete,
  projectLoad,
  projectOpen,
} from '../actions/projects';
import {
  blockCreate,
  blockRename,
} from '../actions/blocks';
import {
  inspectorToggleVisibility,
  inventoryToggleVisibility,
  uiToggleDetailView,
  uiInlineEditor,
  uiShowMenu,
  uiSetGrunt,
  uiShowOkCancel,
  uiShowPublishDialog,
} from '../actions/ui';
import Box2D from '../containers/graphics/geometry/box2d';
import Vector2D from '../containers/graphics/geometry/vector2d';
import TitleAndToolbar from '../components/toolbars/title-and-toolbar';
import downloadProject from '../middleware/utils/downloadProject';
import GlobalNav from './GlobalNav/GlobalNav';
import ConstructViewer from '../containers/graphics/views/constructviewer';

import '../styles/ProjectHeader.css';

class ProjectHeader extends Component {
  static propTypes = {
    blockCreate: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    project: PropTypes.object.isRequired,
    focus: PropTypes.object,
    focusConstruct: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inventoryToggleVisibility: PropTypes.func.isRequired,
    uiToggleDetailView: PropTypes.func.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    uiShowOkCancel: PropTypes.func.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectDelete: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
    inventoryVisible: PropTypes.bool.isRequired,
  };

  /**
   * get position for a context menu attached to one of the inline toolbar items
   * @param anchorElenent
   */
  static getToolbarAnchorPosition(anchorElement) {
    const box = new Box2D(anchorElement.getBoundingClientRect());
    return new Vector2D(box.cx, box.bottom);
  }

  /**
   * add new construct to project
   */
  onAddConstruct = () => {
    const block = this.props.blockCreate({ projectId: this.props.project.id });
    this.props.blockRename(block.id, 'New Construct');
    this.props.projectAddConstruct(this.props.project.id, block.id, true);
    this.props.focusConstruct(block.id);
  };

  onClick = () => {
    this.props.inspectorToggleVisibility(true);
    this.props.focusPrioritize('project');
    const name = this.props.project.metadata.name || 'Untitled Project';
    if (!this.props.project.rules.frozen) {
      this.props.uiInlineEditor((value) => {
        this.props.projectRename(this.props.project.id, value);
      }, name, this.titleEditorBounds(), 'inline-editor-project', ReactDOM.findDOMNode(this).querySelector('.title'));
    }
  };

  /**
   * delete the given project
   * @param project
   */
  onDeleteProject = (project) => {
    this.props.uiShowOkCancel(
      'Delete Project',
      `${this.props.project.getName() || 'Your project'}\nand all related project data will be permanently deleted.\nThis action cannot be undone.`,
      () => {
        this.props.uiShowOkCancel();
        this.deleteProject(this.props.project);
      },
      () => {
        this.props.uiShowOkCancel();
      },
      'Delete Project',
      'Cancel',
    );
  };

  onShareProject = () => {
    this.props.uiShowPublishDialog();
  };

  /**
   * view menu items, can appear on their own menu or the overflow menu
   */
  getViewMenuItems() {
    const showPanels = !this.props.inventoryVisible;
    const firstViewer = ConstructViewer.getAllViewers()[0];
    return [
      {
        text: `${showPanels ? 'Show' : 'Hide'} all panels`,
        action: this.togglePanels,
      },
      {
        text: `${firstViewer && firstViewer.isMinimized() ? 'Show' : 'Hide'} Nested Blocks`,
        disabled: !firstViewer,
        action: () => {
          ConstructViewer.getAllViewers().forEach((viewer) => {
            viewer.setMinimized(!firstViewer.isMinimized());
          });
        },
      },
    ];
  }

  /**
   * toggle the side panels
   */
  togglePanels = () => {
    const showPanels = !this.props.inventoryVisible;
    this.props.inventoryToggleVisibility(showPanels);
    this.props.inspectorToggleVisibility(showPanels);
    if (!showPanels) {
      this.props.uiToggleDetailView(false);
    }
  };

  titleEditorBounds() {
    return new Box2D(ReactDOM.findDOMNode(this).querySelector('.title').getBoundingClientRect());
  }

  /**
   * show view menu for toolbar view item
   * @param anchorElement
   */
  showViewMenu = (anchorElement) => {
    this.props.uiShowMenu(this.getViewMenuItems(), ProjectHeader.getToolbarAnchorPosition(anchorElement), true);
  };

  /**
   * the concatenation of all the inline toolbar actions and sub menus
   * @param anchorElement
   */
  showMoreMenu(anchorElement) {
    this.props.uiShowMenu([
      {
        text: 'New Construct',
        action: this.onAddConstruct,
      },
      {
        text: 'View',
        menuItems: this.getViewMenuItems(),
      },
      {
        text: 'Download Project',
        action: () => {
          downloadProject(this.props.project.id, this.props.focus.options);
        },
      },
      {
        text: 'Delete Project',
        action: this.onDeleteProject,
      },
    ],
      ProjectHeader.getToolbarAnchorPosition(anchorElement),
      true);
  }

  /**
   * perform the actual deletion.
   */
  deleteProject(project) {
    if (project.rules.frozen) {
      this.props.uiSetGrunt('This is a sample project and cannot be deleted.');
    } else {
      //load another project, avoiding this one
      this.props.projectLoad(null, false, [project.id])
        //open the new project, skip saving the previous one
        .then(openProject => this.props.projectOpen(openProject.id, true))
        //delete after we've navigated so dont trigger project page to complain about not being able to laod the project
        .then(() => this.props.projectDelete(project.id));
    }
  }

  /**
   * jsx/js for project toolbar
   * @returns {XML}
   */
  toolbar() {
    return [
      {
        text: 'Add Construct',
        imageURL: '/images/ui/add.svg',
        enabled: true,
        clicked: this.onAddConstruct,
      }, {
        text: 'View',
        imageURL: '/images/ui/view.svg',
        enabled: true,
        clicked: event => this.showViewMenu(event.target),
      }, {
        text: 'Download Project',
        imageURL: '/images/ui/download.svg',
        enabled: true,
        clicked: () => {
          downloadProject(this.props.project.id, this.props.focus.options);
        },
      }, {
        text: 'Share',
        imageUrl: '/images/ui/gear.svg', //todo
        enabled: true,
        clicked: () => this.onShareProject(),
      }, {
        text: 'Delete Project',
        imageURL: '/images/ui/delete.svg',
        enabled: true,
        clicked: this.onDeleteProject,
      }, {
        text: 'More...',
        imageURL: '/images/ui/more.svg',
        enabled: true,
        clicked: (event) => {
          this.showMoreMenu(event.target);
        },
      },
    ];
  }

  /**
   * show the context menu when title is right clicked
   */
  showProjectContextMenu = (position) => {
    const items = [
      {
        text: 'Download Project',
        action: () => {
          downloadProject(this.props.project.id, this.props.focus.options);
        },
      },
      {
        text: 'Duplicate Project',
        disabled: true,
        action: () => { },
      },
      {
        text: 'Delete Project',
        action: this.onDeleteProject,
      },
    ].concat(GlobalNav.getSingleton().getEditMenuItems());
    this.props.uiShowMenu(items, position);
  };

  render() {
    const { project } = this.props;
    return (
      <div className="ProjectHeader">
        <TitleAndToolbar
          onClick={this.onClick}
          noHover={this.props.project.rules.frozen}
          title={project.metadata.name || 'Untitled Project'}
          toolbarItems={this.toolbar()}
          fontSize="1.5rem"
          color="#DFE2EC"
          onContextMenu={position => this.showProjectContextMenu(position)}
        />
      </div>);
  }
}

function mapStateToProps(state, props) {
  return {
    focus: state.focus,
    isFocused: state.focus.level === 'project' && !state.focus.forceProject,
    inventoryVisible: state.ui.inventory.isVisible,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  blockRename,
  inspectorToggleVisibility,
  inventoryToggleVisibility,
  focusPrioritize,
  focusConstruct,
  uiInlineEditor,
  uiSetGrunt,
  uiShowMenu,
  uiShowOkCancel,
  projectAddConstruct,
  projectOpen,
  projectDelete,
  projectLoad,
  projectRename,
  uiToggleDetailView,
  uiShowPublishDialog,
})(ProjectHeader);

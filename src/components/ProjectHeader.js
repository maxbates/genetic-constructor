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
import _ from 'lodash';

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
  projectSave,
} from '../actions/projects';
import {
  blockCreate,
} from '../actions/blocks';
import {
  inspectorToggleVisibility,
  inspectorSelectTab,
  inventoryToggleVisibility,
  uiToggleDetailView,
  uiInlineEditor,
  uiShowMenu,
  uiSetGrunt,
  uiShowPublishDialog,
  uiShowUnpublishDialog,
  uiShowProjectDeleteModal,
  uiShowGenBankImport,
} from '../actions/ui';
import { transact, commit } from '../store/undo/actions';
import Box2D from '../containers/graphics/geometry/box2d';
import Vector2D from '../containers/graphics/geometry/vector2d';
import TitleAndToolbar from '../components/toolbars/title-and-toolbar';
import { downloadProject } from '../middleware/utils/downloadProject';
import GlobalNav from './GlobalNav/GlobalNav';
import ConstructViewer from '../containers/graphics/views/constructviewer';

import '../styles/ProjectHeader.css';

class ProjectHeader extends Component {
  static propTypes = {
    project: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    projectIsPublished: PropTypes.bool.isRequired,
    projectVersionIsPublished: PropTypes.bool.isRequired,
    projectIsDirty: PropTypes.bool.isRequired,
    blockCreate: PropTypes.func.isRequired,
    focus: PropTypes.object,
    focusConstruct: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
    inventoryToggleVisibility: PropTypes.func.isRequired,
    uiToggleDetailView: PropTypes.func.isRequired,
    uiInlineEditor: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    uiShowPublishDialog: PropTypes.func.isRequired,
    uiShowUnpublishDialog: PropTypes.func.isRequired,
    uiShowProjectDeleteModal: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectDelete: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectRename: PropTypes.func.isRequired,
    inventoryVisible: PropTypes.bool.isRequired,
    uiShowGenBankImport: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
  };

  static defaultProps = {
    readOnly: false,
  };

  /**
   * get position for a context menu attached to one of the inline toolbar items
   * @param anchorElement
   */
  static getToolbarAnchorPosition(anchorElement) {
    const box = new Box2D(anchorElement.getBoundingClientRect());
    return new Vector2D(box.cx, box.bottom);
  }

  /**
   * add new construct to project
   */
  onAddConstruct = () => {
    this.props.transact();
    const block = this.props.blockCreate({ metadata: { name: 'New Construct' }, projectId: this.props.project.id });
    this.props.projectAddConstruct(this.props.project.id, block.id, true);
    this.props.focusConstruct(block.id);
    this.props.commit();
  };

  onItemActivated = (event) => {
    event.stopPropagation();
  };

  onFocusInspector = (evt) => {
    this.props.inspectorToggleVisibility(true);
    this.props.inspectorSelectTab('Information');
    this.props.focusPrioritize('project');
  };

  onClick = (evt) => {
    this.onFocusInspector(evt);

    const name = this.props.project.metadata.name || 'Untitled Project';

    if (!this.props.readOnly) {
      this.props.uiInlineEditor((value) => {
        this.props.projectRename(this.props.project.id, value);
      }, name, this.titleEditorBounds(), 'inline-editor-project', ReactDOM.findDOMNode(this).querySelector('.title'));
    }
  };

  /**
   * delete the given project
   */
  onDeleteProject = () => {
    this.props.uiShowProjectDeleteModal(true);
  };

  onShareProject = () => {
    this.props.uiShowPublishDialog();
  };

  onUnpublishProject = () => {
    this.props.uiShowUnpublishDialog();
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
   * start an upload
   */
  upload = () => {
    this.props.projectSave(this.props.project.id)
    .then(() => {
      this.props.uiShowGenBankImport(true);
    });
  };

  /**
   * the concatenation of all the inline toolbar actions and sub menus
   * @param anchorElement
   */
  showMoreMenu(anchorElement) {
    this.props.uiShowMenu([
      {
        text: 'New Construct',
        disabled: this.props.readOnly,
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
        text: 'Upload Genbank or CSV...',
        disabled: this.props.readOnly,
        action: this.upload,
      },
      {
        text: 'Publish Project...',
        disabled: this.props.readOnly || (this.props.projectVersionIsPublished && !this.props.projectIsDirty) || (this.props.project.components.length === 0),
        action: this.onShareProject,
      },
      {
        text: 'Unpublish Project',
        disabled: this.props.readOnly || !this.props.projectIsPublished,
        action: this.onUnpublishProject,
      },
      {
        text: 'Delete Project...',
        disabled: this.props.readOnly,
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
    if (this.props.readOnly || project.rules.frozen) {
      this.props.uiSetGrunt('This is a sample project and cannot be deleted.');
    } else {
      //load another project, avoiding this one
      this.props.projectLoad(null, false, [project.id])
      //open the new project, skip saving the previous one
      .then(rollup => this.props.projectOpen(rollup.project.id, true))
      //delete after we've navigated so dont trigger project page to complain about not being able to laod the project
      .then(() => this.props.projectDelete(project.id));
    }
  }

  /**
   * toolbar items
   * @returns {XML}
   */
  toolbar() {
    return [
      {
        text: 'Add Construct',
        imageURL: '/images/ui/add.svg',
        enabled: !this.props.readOnly,
        onClick: this.onAddConstruct,
      }, {
        text: 'View',
        imageURL: '/images/ui/view.svg',
        onClick: event => this.showViewMenu(event.target),
      }, {
        text: 'Download Project',
        imageURL: '/images/ui/download.svg',
        onClick: () => {
          this.props.uiSetGrunt('Preparing data. Download will begin automatically when complete.');
          downloadProject(this.props.project.id, this.props.focus.options);
        },
      }, {
        text: 'Upload Genbank or CSV',
        imageURL: '/images/ui/upload.svg',
        enabled: !this.props.readOnly,
        onClick: this.upload,
      }, {
        text: 'Share',
        imageURL: '/images/ui/share.svg',
        enabled: !this.props.readOnly && (!this.props.projectVersionIsPublished || this.props.projectIsDirty),
        onClick: this.onShareProject,
      }, {
        text: 'Delete Project',
        imageURL: '/images/ui/delete.svg',
        enabled: !this.props.readOnly && !this.props.projectIsPublished,
        onClick: this.onDeleteProject,
      }, {
        text: 'More...',
        imageURL: '/images/ui/more.svg',
        onClick: (event) => {
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
        disabled: this.props.projectIsPublished,
        action: this.onDeleteProject,
      },
    ].concat(GlobalNav.getSingleton().getEditMenuItems());

    this.props.uiShowMenu(items, position);
  };

  render() {
    const { project } = this.props;
    return (
      <div
        className="ProjectHeader"
        data-testid={`ProjectHeader/${project.id}`}
      >
        <TitleAndToolbar
          onClick={this.onClick}
          onClickBackground={this.onFocusInspector}
          itemActivated={this.onItemActivated}
          noHover={this.props.readOnly}
          title={project.metadata.name || 'Untitled Project'}
          toolbarItems={this.toolbar()}
          fontSize="1.5rem"
          color="#DFE2EC"
          onContextMenu={position => this.showProjectContextMenu(position)}
        />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  //todo - speed up published checks
  return {
    focus: state.focus,
    isFocused: state.focus.level === 'project' && !state.focus.forceProject,
    projectIsPublished: _.some(state.commons.versions, {
      projectId: props.project.id,
    }),
    projectVersionIsPublished: _.some(state.commons.versions, {
      projectId: props.project.id,
      version: props.project.version,
    }),
    projectIsDirty: state.autosave.dirty,
    inventoryVisible: state.ui.inventory.isVisible,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  inspectorToggleVisibility,
  inspectorSelectTab,
  inventoryToggleVisibility,
  focusPrioritize,
  focusConstruct,
  uiInlineEditor,
  uiSetGrunt,
  uiShowMenu,
  projectAddConstruct,
  projectOpen,
  projectDelete,
  projectLoad,
  projectSave,
  projectRename,
  uiToggleDetailView,
  uiShowGenBankImport,
  uiShowPublishDialog,
  uiShowUnpublishDialog,
  uiShowProjectDeleteModal,
  transact,
  commit,
})(ProjectHeader);

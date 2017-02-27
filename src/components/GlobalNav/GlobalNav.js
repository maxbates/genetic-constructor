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
/* global flashedUser:false, heap:false */
import invariant from 'invariant';
import KeyboardTrap from 'mousetrap';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import {
  blockAddComponents,
  blockClone,
  blockCreate,
  blockDelete,
  blockDetach,
  blockRemoveComponent,
  blockRename,
} from '../../actions/blocks';
import { clipboardSetData } from '../../actions/clipboard';
import { focusBlocks, focusBlocksAdd, focusBlocksToggle, focusConstruct } from '../../actions/focus';
import { projectAddConstruct, projectCreate, projectOpen, projectSave } from '../../actions/projects';
import {
  inspectorToggleVisibility,
  inventorySelectTab,
  inventoryToggleVisibility,
  uiToggleDetailView,
  detailViewSelectExtension,
} from '../../actions/ui';
import OkCancel from '../modal/okcancel';
import RibbonGrunt from '../ribbongrunt';
import * as clipboardFormats from '../../constants/clipboardFormats';
import Rollup from '../../models/Rollup';
import { blockGetComponentsRecursive, blockGetParents } from '../../selectors/blocks';
import { projectGetVersion } from '../../selectors/projects';
import * as instanceMap from '../../store/instanceMap';
import { commit, redo, transact, undo } from '../../store/undo/actions';
import { stringToShortcut } from '../../utils/ui/keyboard-translator';
import { sortBlocksByIndexAndDepth, sortBlocksByIndexAndDepthExclude } from '../../utils/ui/uiapi';

import '../../styles/GlobalNav.css';

// sequence viewer extension name
const sequenceViewerName = 'GC-Sequence-Viewer';

class GlobalNav extends Component {
  static propTypes = {
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    currentProjectId: PropTypes.string,
    blockCreate: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    blockGetParents: PropTypes.func.isRequired,
    focusBlocks: PropTypes.func.isRequired,
    inventoryToggleVisibility: PropTypes.func.isRequired,
    uiToggleDetailView: PropTypes.func.isRequired,
    detailViewSelectExtension: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    projectGetVersion: PropTypes.func.isRequired,
    blockClone: PropTypes.func.isRequired,
    clipboardSetData: PropTypes.func.isRequired,
    inventorySelectTab: PropTypes.func.isRequired,
    blockDetach: PropTypes.func.isRequired,
    clipboard: PropTypes.shape({
      formats: PropTypes.array.isRequired,
      data: PropTypes.any,
    }).isRequired,
    blockGetComponentsRecursive: PropTypes.func.isRequired,
    blockAddComponents: PropTypes.func.isRequired,
    focus: PropTypes.object.isRequired,
    blocks: PropTypes.object,
    inventoryVisible: PropTypes.bool.isRequired,
  };

  /**
   * singleton instance of GlobalNav
   */
  static getSingleton() {
    return GlobalNav.singleton;
  }

  constructor(props) {
    super(props);

    // assign singleton
    GlobalNav.singleton = this;

    // keyboard shortcuts
    //
    // ************ FILE MENU ***********
    KeyboardTrap.bind('mod+s', (evt) => {
      evt.preventDefault();
      this.saveProject();
    });
    KeyboardTrap.bind('mod+o', (evt) => {
      evt.preventDefault();
      this.props.inventoryToggleVisibility(true);
      this.props.inventorySelectTab('projects');
    });
    KeyboardTrap.bind('mod+f', (evt) => {
      evt.preventDefault();
      this.props.inventoryToggleVisibility(true);
      this.props.inventorySelectTab('search');
    });
    KeyboardTrap.bind('option+n', (evt) => {
      evt.preventDefault();
      this.newProject();
    });
    KeyboardTrap.bind('shift+option+n', (evt) => {
      evt.preventDefault();
      this.newConstruct();
    });
    // ************ EDIT MENU ***********
    KeyboardTrap.bind('mod+z', (evt) => {
      evt.preventDefault();
      this.props.undo();
    });
    KeyboardTrap.bind('mod+shift+z', (evt) => {
      evt.preventDefault();
      this.props.redo();
    });
    // select all/cut/copy/paste
    KeyboardTrap.bind('mod+a', (evt) => {
      evt.preventDefault();
      this.onSelectAll();
    });
    KeyboardTrap.bind('mod+x', (evt) => {
      evt.preventDefault();
      this.cutFocusedBlocksToClipboard();
    });
    KeyboardTrap.bind('mod+c', (evt) => {
      evt.preventDefault();
      this.copyFocusedBlocksToClipboard();
    });
    KeyboardTrap.bind('mod+v', (evt) => {
      evt.preventDefault();
      this.pasteBlocksToConstruct();
    });
    // **************** VIEW ******************
    KeyboardTrap.bind('shift+mod+i', (evt) => {
      evt.preventDefault();
      this.props.inventoryToggleVisibility();
    });
    KeyboardTrap.bind('mod+i', (evt) => {
      evt.preventDefault();
      this.props.inspectorToggleVisibility();
    });
    KeyboardTrap.bind('mod+u', (evt) => {
      evt.preventDefault();
      this.props.uiToggleDetailView();
    });
    KeyboardTrap.bind('mod+b', (evt) => {
      evt.preventDefault();
      this.props.inventoryToggleVisibility(true);
      this.props.inventorySelectTab('role');
    });
  }

  state = {
    showAddProject: false,
    recentProjects: [],
  };

  componentDidMount() {
    // if we have a user then identify them to heap
    if (heap && heap.identify && flashedUser && flashedUser.email) {
      heap.identify(flashedUser.email);
    }
  }

  /**
   * unsink all keyboard events on unmount
   */
  componentWillUnmount() {
    KeyboardTrap.reset();
  }

  /**
   * select all blocks of the current construct
   */
  onSelectAll() {
    this.props.focusBlocks(this.props.blockGetComponentsRecursive(this.props.focus.constructId).map(block => block.id));
  }

  /**
   * return menu items for select all, cut, copy, paste, undo, redo
   * @returns {[*,*,*,*,*,*,*,*]}
   */
  getEditMenuItems() {
    return [
      {},
      {
        text: 'Select All',
        shortcut: stringToShortcut('meta A'),
        disabled: !this.props.focus.constructId,
        action: () => {
          this.onSelectAll();
        },
      }, {
        text: 'Cut',
        shortcut: stringToShortcut('meta X'),
        disabled: !this.props.focus.blockIds.length || !this.focusedConstruct() || this.focusedConstruct().isFixed() || this.focusedConstruct().isFrozen(),
        action: () => {
          this.cutFocusedBlocksToClipboard();
        },
      }, {
        text: 'Copy',
        shortcut: stringToShortcut('meta C'),
        disabled: !this.props.focus.blockIds.length || !this.focusedConstruct() || this.focusedConstruct().isFixed() || this.focusedConstruct().isFrozen(),
        action: () => {
          this.copyFocusedBlocksToClipboard();
        },
      }, {
        text: 'Paste',
        shortcut: stringToShortcut('meta V'),
        disabled: !(this.props.clipboard.formats.indexOf(clipboardFormats.blocks) >= 0) || !this.focusedConstruct() || this.focusedConstruct().isFixed() || this.focusedConstruct().isFrozen(),
        action: () => {
          this.pasteBlocksToConstruct();
        },
      },
      {},
      {
        text: 'Undo',
        shortcut: stringToShortcut('meta z'),
        action: () => {
          this.props.undo();
        },
      }, {
        text: 'Redo',
        shortcut: stringToShortcut('shift meta z'),
        action: () => {
          this.props.redo();
        },
      },
    ];
  }
  /**
   * add a new construct to the current project
   */
  newConstruct(initialModel = {}) {
    this.props.transact();
    const block = this.props.blockCreate(initialModel);
    this.props.projectAddConstruct(this.props.currentProjectId, block.id, true);
    this.props.commit();
    this.props.focusConstruct(block.id);
    return block;
  }

  /**
   * get parent block of block with given id
   */
  blockGetParent(blockId) {
    return this.props.blockGetParents(blockId)[0];
  }

  /**
   * return the block we are going to insert after
   */
  findInsertBlock() {
    // sort blocks according to 'natural order'
    const sorted = sortBlocksByIndexAndDepth(this.props.focus.blockIds);
    // the right most, top most block is the insertion point
    const highest = sorted.pop();
    // return parent of highest block and index + 1 so that the block is inserted after the highest block
    return {
      parent: this.blockGetParent(this.props.blocks[highest.blockId].id).id,
      index: highest.index + 1,
    };
  }

  // copy the focused blocks to the clipboard using a deep clone
  copyFocusedBlocksToClipboard() {
    // we don't currently allow copying from frozen / fixed constructs since that would allow copy ( and then pasting )
    // of list blocks from temlates.
    if (this.props.focus.blockIds.length && !this.focusedConstruct().isFixed() && !this.focusedConstruct().isFrozen()) {
      // sort selected blocks so they are pasted in the same order as they exist now.
      // NOTE: we don't copy the children of any selected parents since they will
      // be cloned along with their parent
      const sorted = sortBlocksByIndexAndDepthExclude(this.props.focus.blockIds);
      // sorted is an array of array, flatten while retaining order
      const currentProjectVersion = this.props.projectGetVersion(this.props.currentProjectId);
      const clones = sorted.map(info => this.props.blockClone(info.blockId, {
        projectId: this.props.currentProjectId,
        version: currentProjectVersion,
      }));
      // put clones on the clipboardparentObjectInput
      this.props.clipboardSetData([clipboardFormats.blocks], [clones]);
    }
  }

  /**
   * save current project, return promise for chaining
   */
  saveProject() {
    return this.props.projectSave(this.props.currentProjectId);
  }

  /**
   * return true if the focused construct is fixrf
   * @return {Boolean} [description]
   */
  focusedConstruct() {
    if (this.props.focus.constructId) {
      return this.props.blocks[this.props.focus.constructId];
    }
    return null;
  }

  // cut focused blocks to the clipboard, no clone required since we are removing them.
  cutFocusedBlocksToClipboard() {
    if (this.props.focus.blockIds.length && !this.focusedConstruct().isFixed() && !this.focusedConstruct().isFrozen()) {
      const blockIds = this.props.blockDetach(...this.props.focus.blockIds);
      this.props.clipboardSetData([clipboardFormats.blocks], [blockIds.map(blockId => this.props.blocks[blockId])]);
      this.props.focusBlocks([]);
    }
  }

  // paste from clipboard to current construct
  pasteBlocksToConstruct() {
    // verify current construct
    invariant(this.focusedConstruct(), 'expected a construct');
    // ignore if construct is immutable
    if (this.focusedConstruct().isFixed() && this.focusedConstruct().isFrozen()) {
      return;
    }
    // paste blocks into construct if format available
    const index = this.props.clipboard.formats.indexOf(clipboardFormats.blocks);
    if (index >= 0) {
      // TODO, paste must be prevented on fixed or frozen blocks
      const blocks = this.props.clipboard.data[index];
      invariant(blocks && blocks.length && Array.isArray(blocks), 'expected array of blocks on clipboard for this format');
      // we have to clone the blocks currently on the clipboard since they
      // can't be pasted twice
      const clones = blocks.map(block => this.props.blockClone(block.id));
      // insert at end of construct if no blocks selected
      let insertIndex = this.focusedConstruct().components.length;
      let parentId = this.focusedConstruct().id;
      if (this.props.focus.blockIds.length) {
        const insertInfo = this.findInsertBlock();
        insertIndex = insertInfo.index;
        parentId = insertInfo.parent;
      }
      // add to construct
      this.props.blockAddComponents(parentId, clones.map(clone => clone.id), insertIndex);

      // select the clones
      this.props.focusBlocks(clones.map(clone => clone.id));
    }
  }

  /**
   * new project and navigate to new project
   */
  newProject() {
    // create project and add a default construct
    const project = this.props.projectCreate();
    // add a construct to the new project
    const block = this.props.blockCreate({ projectId: project.id });
    this.props.blockRename(block.id, 'New Construct');
    const projectWithConstruct = this.props.projectAddConstruct(project.id, block.id, true);

    //save this to the instanceMap as cached version, so that when projectSave(), will skip until the user has actually made changes
    //do this outside the actions because we do some mutations after the project + construct are created (i.e., add the construct)
    instanceMap.saveRollup(new Rollup({
      project: projectWithConstruct,
      blocks: {
        [block.id]: block,
      },
    }));

    this.props.focusConstruct(block.id);
    this.props.projectOpen(project.id);
  }

  /**
   * toggle the side panels
   */
  togglePanels = () => {
    const showPanels = !this.props.inventoryVisible;
    this.props.inventoryToggleVisibility(showPanels);
    this.props.inspectorToggleVisibility(showPanels);
    if (showPanels) {
      this.showSequenceViewer();
    } else {
      this.hideSequenceViewer();
    }
  };

  /**
   * hide sequence viewer
   */
  hideSequenceViewer() {
    this.props.uiToggleDetailView(false);
  }

  /**
   * show the sequence viewer
   */
  showSequenceViewer() {
    this.props.focusBlocks([]);
    this.props.detailViewSelectExtension(sequenceViewerName);
    this.props.uiToggleDetailView(true);
  }

  render() {
    return (
      <div className="GlobalNav">
        <RibbonGrunt />
        <div className="GlobalNav-logo">
          <img
            role="presentation"
            onClick={this.togglePanels}
          />
        </div>
        <div className="GlobalNav-appname">Genetic Constructor</div>
        <OkCancel />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    focus: state.focus,
    blocks: state.blocks,
    clipboard: state.clipboard,
    currentConstruct: state.blocks[state.focus.constructId],
    inventoryVisible: state.ui.inventory.isVisible,
    visibleExtension: state.ui.detailView.isVisible ? state.ui.detailView.currentExtension : null,
  };
}

export default connect(mapStateToProps, {
  projectAddConstruct,
  projectCreate,
  projectSave,
  projectOpen,
  projectGetVersion,
  blockCreate,
  blockClone,
  blockDelete,
  blockDetach,
  blockRename,
  inspectorToggleVisibility,
  inventoryToggleVisibility,
  blockRemoveComponent,
  blockGetParents,
  blockGetComponentsRecursive,
  inventorySelectTab,
  undo,
  redo,
  transact,
  commit,
  uiToggleDetailView,
  focusBlocks,
  focusBlocksAdd,
  focusBlocksToggle,
  focusConstruct,
  clipboardSetData,
  blockAddComponents,
  detailViewSelectExtension,
})(GlobalNav);

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
import { blockStash } from '../../actions/blocks';
import {
  projectCreate,
  projectAddConstruct,
  projectSave,
  projectOpen,
  projectDelete,
  projectList,
  projectLoad,
} from '../../actions/projects';
import {
  blockCreate,
} from '../../actions/blocks';
import * as instanceMap from '../../store/instanceMap';
import Spinner from '../ui/Spinner';
import Tree from '../ui/Tree';
import {
  focusForceProject,
  focusForceBlocks,
  focusConstruct,
} from '../../actions/focus';
import {
  inspectorToggleVisibility,
  inspectorSelectTab,
} from '../../actions/ui';
import BasePairCount from '../ui/BasePairCount';
import DnD from '../../containers/graphics/dnd/dnd';
import {
  uiShowMenu,
  uiShowOkCancel,
  uiSetGrunt,
} from '../../actions/ui';
import { block as blockDragType } from '../../constants/DragTypes';
import { transact, commit } from '../../store/undo/actions';
import { extensionApiPath } from '../../middleware/utils/paths';

import '../../styles/InventoryProjectTree.css';

export class InventoryProjectTree extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string,
    projects: PropTypes.object.isRequired,
    blockCreate: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    templates: PropTypes.bool.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectDelete: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focus: PropTypes.object.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    focusForceProject: PropTypes.func.isRequired,
    focusForceBlocks: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    uiSetGrunt: PropTypes.func.isRequired,
    uiShowOkCancel: PropTypes.func.isRequired,
    blocks: PropTypes.object.isRequired,
    filter: PropTypes.string.isRequired,
  };

  state = {
    isLoading: true,
  };

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
    .then(() => this.setState({ isLoading: false }));
  }


  /**
   * when a project is expanded, we need to load to get the blocks and also inspect it
   * @param projectId
   */
  onExpandProject(project, item) {
    this.props.projectLoad(project.id)
    .then(() => {
      this.props.focusForceProject(project);
      this.props.inspectorToggleVisibility(true);
      this.props.inspectorSelectTab('Information');
    });
  }

  /**
   * when a block is expanded, show it in the inspector
   * @param projectId
   */
  onExpandBlock(block, item) {
    // TODO, this should work but is broken in DEV currently as well
    this.props.focusForceBlocks([block]);
    this.props.inspectorToggleVisibility(true);
    this.props.inspectorSelectTab('Information');
  }

  /**
   * when a project is opened ( from the open widget in the tree expandos )
   * @param projectId
   */
  onOpenProject(project, evt) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.props.projectLoad(project.id)
    .then(() => {
      this.props.projectOpen(project.id);
    });
  }

  /**
   * make a drag and drop proxy for the item
   */
  makeDnDProxy(block) {
    const proxy = document.createElement('div');
    proxy.className = 'InventoryItemProxy';
    proxy.innerHTML = block.getName();
    return proxy;
  }

  /**
   * block dragged from project inventory
   * @param block
   * @param globalPoint
   */
  onBlockDrag(block, globalPoint) {
    DnD.startDrag(this.makeDnDProxy(block), globalPoint, {
      item: block,
      type: blockDragType,
      source: 'inventory',
    });
  }

  /**
   * build a nested set of tree items from the given components array
   * @param components
   */
  getProjectBlocksRecursive(components, depth, maxDepth = Number.MAX_VALUE) {
    const items = [];
    if (depth < maxDepth) {
      (components || []).forEach(blockId => {
        const block = this.props.blocks[blockId] || instanceMap.getBlock(blockId);
        if (block) {
          const hasSequence = block.sequence && block.sequence.length > 0;
          items.push({
            block,
            testid: block.id,
            text: block.getName(),
            textWidgets: [
              hasSequence ? <BasePairCount key="bpc" count={block.sequence.length} style={{ color: 'gray' }}/> : null,
            ],
            onExpand: this.onExpandBlock.bind(this, block),
            items: this.getProjectBlocksRecursive(block.components, depth + 1, maxDepth),
            startDrag: this.onBlockDrag.bind(this, block),
            locked: block.isFrozen(),
          });
        }
      });
    }
    return items;
  }

  /**
   * create a new project and navigate to it.
   */
  onNewProject = () => {
    // create project and add a default construct
    const project = this.props.projectCreate();
    // add a construct to the new project
    const block = this.props.blockCreate({ projectId: project.id });
    const projectWithConstruct = this.props.projectAddConstruct(project.id, block.id);

    //save this to the instanceMap as cached version, so that when projectSave(), will skip until the user has actually made changes
    //do this outside the actions because we do some mutations after the project + construct are created (i.e., add the construct)
    instanceMap.saveRollup({
      project: projectWithConstruct,
      blocks: {
        [block.id]: block,
      },
    });

    this.props.focusConstruct(block.id);
    this.props.projectOpen(project.id);
  };

  /**
   * delete the given project
   * @param project
   */
  onDeleteProject = (project) => {
    this.props.uiShowOkCancel(
      'Delete Project',
      `${project.getName() || 'Your project'}\nand all related project data will be permanently deleted.\nThis action cannot be undone.`,
      () => {
        this.props.uiShowOkCancel();
        this.deleteProject(project);
      },
      () => {
        this.props.uiShowOkCancel();
      },
      'Delete Project',
      'Cancel'
    );
  };

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
   * add a new construct to the bound project ( initial model used for templates )
   */
  onNewConstruct = (project, initialModel = {}) => {
    this.props.transact();
    const block = this.props.blockCreate(initialModel);
    this.props.projectAddConstruct(this.props.currentProjectId, block.id);
    this.props.commit();
    this.props.focusConstruct(block.id);
    return block;
  };

  /**
   * new template construct added to bound project
   * @param project
   */
  onNewTemplate = (project) => {
    return this.onNewConstruct(project, { rules: { authoring: true, fixed: true } });
  };


  /**
   * used want to open the context menu for the project.
   * @param project
   */
  onProjectContextMenu = (project, evt) => {
    this.props.uiShowMenu([
      {
        text: 'Open Project',
        action: this.onOpenProject.bind(this, project),
      },
      {},
      {
        text: 'New Project',
        action: this.onNewProject,
      },
      {
        text: this.props.templates ? 'New Template' : 'New Construct',
        action: this.props.templates ? this.onNewTemplate.bind(this, project) : this.onNewConstruct.bind(this, project),
      },
      {},
      {
        text: 'Download Project',
        action: this.downloadProject.bind(this, project),
      },
      {
        text: 'Duplicate Project',
        disabled: true,
        action: () => {},
      },
      {
        text: 'Delete Project',
        action: this.onDeleteProject.bind(this, project),
      },
    ], {
      x: evt.pageX,
      y: evt.pageY,
    });
  };

  /**
   * download the current file as a genbank file
   *
   */
  downloadProject = (project) => {
    this.props.projectSave(project.id)
    .then(() => {
      //todo - maybe this whole complicated bit should go in middleware as its own function

      const url = extensionApiPath('genbank', `export/${project.id}`);
      const postBody = this.props.focus.options;
      const iframeTarget = '' + Math.floor(Math.random() * 10000) + +Date.now();

      // for now use an iframe otherwise any errors will corrupt the page
      const iframe = document.createElement('iframe');
      iframe.name = iframeTarget;
      iframe.style.display = 'none';
      iframe.src = '';
      document.body.appendChild(iframe);

      //make form to post to iframe
      const form = document.createElement('form');
      form.style.display = 'none';
      form.action = url;
      form.method = 'post';
      form.target = iframeTarget;

      //add inputs to the form for each value in postBody
      Object.keys(postBody).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = postBody[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      //removing elements will cancel, so give them a nice timeout
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 60 * 1000);
    });
  };


  render() {
    const { projects, currentProjectId } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }
    // filter on frozen rule to separate templates from projects and also match to the current search filter
    const filtered = {};
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];
      if (this.props.templates === !!project.rules.frozen) {
        const name = project.metadata.name ? project.metadata.name.toLowerCase() : '';
        const filter = this.props.filter.toLowerCase();
        if (name.indexOf(filter) >= 0) {
          filtered[projectId] = projects[projectId];
        }
      }
    });

    // map projects to items for use in a tree
    const treeItems = Object.keys(filtered)
    .map(projectId => filtered[projectId])
    .sort((one, two) => two.metadata.created - one.metadata.created)
    .map(project => {
      return {
        text: project.getName(),
        testid: project.id,
        bold: true,
        selected: project.id === currentProjectId,
        onExpand: this.onExpandProject.bind(this, project),
        onContextMenu: this.onProjectContextMenu.bind(this, project),
        items: this.getProjectBlocksRecursive(project.components, 0, project.rules.frozen ? 1 : Number.MAX_VALUE),
        labelWidgets: [
          <img
            key="open"
            src="/images/ui/open.svg"
            onClick={this.onOpenProject.bind(this, project)}
            className="label-hover-bright"
          />,
        ],
      };
    });

    return (
      <div>
        <div className="inventory-project-tree">
          <Tree items={treeItems}/>
        </div>
      </div>);
  }
}

function mapStateToProps(state, props) {
  const { projects, blocks, focus } = state;

  return {
    focus,
    projects,
    blocks,
  };
}

export default connect(mapStateToProps, {
  blockCreate,
  blockStash,
  projectCreate,
  projectAddConstruct,
  projectSave,
  projectOpen,
  projectDelete,
  projectList,
  projectLoad,
  focusConstruct,
  focusForceProject,
  focusForceBlocks,
  inspectorToggleVisibility,
  inspectorSelectTab,
  transact,
  commit,
  uiShowMenu,
  uiShowOkCancel,
  uiSetGrunt,
})(InventoryProjectTree);

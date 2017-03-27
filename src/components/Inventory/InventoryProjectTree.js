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
import _ from 'lodash';

import { blockCreate } from '../../actions/blocks';
import {
  focusPrioritize,
  focusConstruct,
  focusForceBlocks,
  focusForceProject,
  focusBlocks,
} from '../../actions/focus';
import {
  blockGetParents,
} from '../../selectors/blocks';
import {
  projectAddConstruct,
  projectCreate,
  projectList,
  projectLoad,
  projectOpen,
  projectSave,
} from '../../actions/projects';
import {
  inspectorSelectTab,
  inspectorToggleVisibility,
  uiShowMenu,
  uiShowProjectDeleteModal,
} from '../../actions/ui';
import { block as blockDragType } from '../../constants/DragTypes';
import Rollup from '../../models/Rollup';
import DnD from '../../containers/graphics/dnd/dnd';
import * as instanceMap from '../../store/instanceMap';
import { commit, transact } from '../../store/undo/actions';
import Spinner from '../ui/Spinner';
import Tree from '../ui/Tree';
import BasePairCount from '../ui/BasePairCount';
import { downloadProject } from '../../middleware/utils/downloadProject';

import '../../styles/InventoryProjectTree.css';

export class InventoryProjectTree extends Component {
  static propTypes = {
    //props
    currentProjectId: PropTypes.string,
    filter: PropTypes.string.isRequired,
    templates: PropTypes.bool.isRequired,
    //state
    projects: PropTypes.object.isRequired,
    blocks: PropTypes.object.isRequired,
    focus: PropTypes.object.isRequired,
    //actions
    blockCreate: PropTypes.func.isRequired,
    blockGetParents: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    projectCreate: PropTypes.func.isRequired,
    projectAddConstruct: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    focusBlocks: PropTypes.func.isRequired,
    focusForceProject: PropTypes.func.isRequired,
    focusForceBlocks: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    uiShowProjectDeleteModal: PropTypes.func.isRequired,
  };

  /**
   * make a drag and drop proxy for the item
   */
  static makeDnDProxy(block) {
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
  static onBlockDrag(block, globalPoint) {
    DnD.startDrag(InventoryProjectTree.makeDnDProxy(block), globalPoint, {
      item: block,
      type: blockDragType,
      source: 'inventory',
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      isLoading: _.filter(props.projects, project => !!props.templates === !!project.rules.frozen).length === 0,
    };
  }

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
    .then(() => this.setState({ isLoading: false }));
  }

  /**
   * when a project is expanded, we need to load to get the blocks and also inspect it
   * @param projectId
   */
  onClickProject(project, item) {
    const loadedProject = this.props.projects[project.id];
    const projectLoaded = project.id === this.props.currentProjectId ||
      (loadedProject && loadedProject.components && loadedProject.components.every(componentId => this.props.blocks[componentId]));

    const promise = (projectLoaded) ?
      Promise.resolve() :
      this.props.projectLoad(project.id);

    promise
    .then(() => {
      if (project.id === this.props.currentProjectId) {
        this.props.focusPrioritize('project');
      } else {
        this.props.focusForceProject(project);
      }

      this.props.inspectorToggleVisibility(true);
      this.props.inspectorSelectTab('Information');
    });
  }

  /**
   * when a block is expanded, show it in the inspector
   * @param projectId
   */
  onClickBlock(block) {
    // if block/construct is from the current project focus the block/construct...
    if (block.projectId === this.props.currentProjectId) {
      if (!this.props.blockGetParents(block.id).length) {
        this.props.focusConstruct(block.id);
      } else {
        this.props.focusBlocks([block.id]);
      }
    } else {
      // ...otherwise just show in inspector
      this.props.focusForceBlocks([block]);
    }
    this.props.inspectorToggleVisibility(true);
    this.props.inspectorSelectTab('Information');
  }

  /**
   * when a project is opened ( from the open widget in the tree expandos )
   * @param project
   */
  onOpenProject = (project, evt) => {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.props.projectLoad(project.id)
    .then(() => {
      this.props.projectOpen(project.id);
    });
  };

  /**
   * create a new project and navigate to it.
   * //todo - share with DeleteProjectModal better
   */
  onNewProject = () => {
    // create project and add a default construct
    const project = this.props.projectCreate();
    // add a construct to the new project
    const block = this.props.blockCreate({ projectId: project.id });
    const projectWithConstruct = this.props.projectAddConstruct(project.id, block.id, true);
    const rollup = new Rollup({
      project: projectWithConstruct,
      blocks: {
        [block.id]: block,
      },
    });

    //save this to the instanceMap as cached version, so that when projectSave(), will skip until the user has actually made changes
    //do this outside the actions because we do some mutations after the project + construct are created (i.e., add the construct)
    instanceMap.saveRollup(rollup);

    this.props.focusConstruct(block.id);
    this.props.projectOpen(project.id);

    return rollup;
  };

  /**
   * delete the given project
   * @param project
   */
  onDeleteProject = (project) => {
    this.props.uiShowProjectDeleteModal(true, project.id);
  };

  /**
   * add a new construct to the bound project ( initial model used for templates )
   */
  onNewConstruct = (project, initialModel = {}) => {
    this.props.transact();
    const block = this.props.blockCreate(initialModel);
    this.props.projectAddConstruct(this.props.currentProjectId, block.id, true);
    this.props.commit();
    this.props.focusConstruct(block.id);
    return block;
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
        action: this.onNewConstruct.bind(this, project),
      },
      {},
      {
        text: 'Download Project',
        action: () => this.onDownloadProject(project),
      },
      {
        text: 'Duplicate Project',
        disabled: true,
        action: () => {},
      },
      {
        text: 'Delete Project',
        action: () => {
          this.onDeleteProject(project);
        },
      },
    ], {
      x: evt.pageX,
      y: evt.pageY,
    });
  };

  /**
   * download the current file as a genbank file
   */
  onDownloadProject = (project) => {
    this.props.projectSave(project.id)
    .then(() => {
      downloadProject(project.id, this.props.focus.options);
    });
  };

  /**
   * build a nested set of tree items from the given components array
   * @param components
   * @param depth
   * @param maxDepth
   */
  getProjectBlocksRecursive(components, depth, maxDepth = Number.MAX_VALUE) {
    const items = [];
    if (depth < maxDepth) {
      (components || []).forEach((blockId) => {
        const block = this.props.blocks[blockId] || instanceMap.getBlock(blockId);
        if (block) {
          const hasSequence = block.sequence && block.sequence.length > 0;
          items.push({
            block,
            testid: block.id,
            stateKey: block.id,
            text: block.getName(),
            textWidgets: [
              hasSequence ? <BasePairCount count={block.sequence.length} style={{ color: 'gray' }} /> : null,
            ],
            onClick: this.onClickBlock.bind(this, block),
            items: this.getProjectBlocksRecursive(block.components, depth + 1, maxDepth),
            startDrag: (globalPosition) => {
              InventoryProjectTree.onBlockDrag(block, globalPosition);
            },
            // locked: block.isFrozen(), //hide locks in the inventory
          });
        }
      });
    }
    return items;
  }

  getSortedProjectManifests = () => {
    const { projects, templates, filter } = this.props;

    return _.chain(projects)
    .pickBy((project) => {
      //if want template, and dont have frozen project, skip
      //double bang to handle undefined
      if (!!templates !== !!project.rules.frozen) {
        return false;
      }

      //if filtering, and name doesnt match, skip
      const name = project.metadata.name ? project.metadata.name.toLowerCase() : '';
      const filterString = filter.toLowerCase();
      if (!filterString) {
        return true;
      }
      return name.indexOf(filterString) >= 0;
    })
    .orderBy(['metadata.created'], ['desc'])
    .value();
  };

  render() {
    const { currentProjectId, focus } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }

    const treeItems = this.getSortedProjectManifests()
    .map(project => ({
      text: project.getName(),
      testid: `inventoryProject/${project.id}`,
      stateKey: project.id,
      bold: true,
      selected: project.id === currentProjectId,
      selectedAlt: focus.forceProject && project.id === focus.forceProject.id,
      onClick: () => this.onClickProject(project),
      onContextMenu: (evt) => {
        this.onProjectContextMenu(project, evt);
      },
      items: this.getProjectBlocksRecursive(project.components, 0, project.rules.frozen ? 1 : Number.MAX_VALUE),
      labelWidgets: [
        <img
          key="open"
          role="presentation"
          data-testid={`openProject/${project.id}`}
          src="/images/ui/open.svg"
          onClick={evt => this.onOpenProject(project, evt)}
          className="label-hover-bright"
        />,
      ],
    }));

    return (
      <div>
        <div className="inventory-project-tree">
          <Tree items={treeItems} />
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
  blockGetParents,
  projectCreate,
  projectAddConstruct,
  projectSave,
  projectOpen,
  projectList,
  projectLoad,
  focusPrioritize,
  focusConstruct,
  focusForceProject,
  focusForceBlocks,
  focusBlocks,
  inspectorToggleVisibility,
  inspectorSelectTab,
  transact,
  commit,
  uiShowMenu,
  uiShowProjectDeleteModal,
})(InventoryProjectTree);

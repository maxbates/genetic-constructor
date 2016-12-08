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
import InventorySearch from './InventorySearch';
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
import { uiShowMenu } from '../../actions/ui';

import '../../styles/InventoryProjectTree.css';

export class InventoryProjectTree extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string,
    projects: PropTypes.object.isRequired,
    blockCreate: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
    projectList: PropTypes.func.isRequired,
    templates: PropTypes.bool.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectGet: PropTypes.func.isRequired,
    projectSave: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    focusConstruct: PropTypes.func.isRequired,
    focusForceProject: PropTypes.func.isRequired,
    focusForceBlocks: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
  };

  state = {
    isLoading: true,
    filter: InventoryProjectTree.filter || '',
  };

  //will retrigger on each load
  componentDidMount() {
    this.props.projectList()
    .then(() => this.setState({ isLoading: false }));
  }

  static filter = '';

  handleFilterChange = (filter) => {
    InventoryProjectTree.filter = filter;
    this.setState({ filter });
  };

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
      this.props.projectOpen(project.id)
    });
  }

  /**
   * make a drag and drop proxy for the item
   */
  makeDnDProxy(block) {
    const proxy = document.createElement('div');
    proxy.className = 'InventoryItemProxy';
    proxy.innerHTML = block.getName();
    // const svg = this.itemElement.querySelector('svg');
    // if (svg) {
    //   const svgClone = svg.cloneNode(true);
    //   svgClone.removeAttribute('data-reactid');
    //   proxy.appendChild(svgClone);
    // }
    return proxy;
  }

  onBlockDrag(block, globalPoint) {
    console.log('Start Drag:', block.getName(), ' Point:', globalPoint.toString());
    // start DND
    DnD.startDrag(this.makeDnDProxy(block), globalPoint, {
      item: block,
      type: 'block',
      source: 'inventory',
    }, {
      onDrop: (target, position) => {
        // if (this.props.onDrop) {
        //   return this.props.onDrop(this.props.item, target, position);
        // }
      },
      onDropFailure: (error, target) => {
        // this.props.uiSetGrunt(`There was an error creating a block for ${this.props.item.metadata.name}`);
        // this.props.uiSpin();
        // if (this.props.onDropFailure) {
        //   return this.props.onDropFailure(error, target);
        // }
      },
      onDragComplete: (target, position, payload) => {
        // if (this.props.onDragComplete) {
        //   this.props.onDragComplete(payload.item, target, position);
        // }
      },
    });
  }

  /**
   * build a nested set of tree items from the given components array
   * @param components
   */
  getProjectBlocksRecursive(components) {
    const items = [];
    (components || []).forEach(blockId => {
      const block = this.props.blocks[blockId] || instanceMap.getBlock(blockId);
      if (block) {
        const hasSequence = block.sequence && block.sequence.length > 0;
        items.push({
          block,
          text: block.getName(),
          textWidgets: [
            hasSequence ? <BasePairCount count={block.sequence.length} style={{color: 'gray'}}/> : null,
          ],
          onExpand: this.onExpandBlock.bind(this, block),
          items: this.getProjectBlocksRecursive(block.components),
          startDrag: this.onBlockDrag.bind(this, block),
        })
      }
    });
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
    this.props.projectDelete(project.id);
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
      {},
      {
        text: 'Download Project',
        action: () => {},
      },
      {
        text: 'Duplicate Project',
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

  render() {
    const { projects, currentProjectId } = this.props;
    const { isLoading } = this.state;

    if (isLoading) {
      return <Spinner />;
    }
    // filter on isSample to separate templates from projects and also match to the current search filter
    const filtered = {};
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];
      if (this.props.templates === !!project.isSample) {
        const name = project.metadata.name ? project.metadata.name.toLowerCase() : '';
        const filter = this.state.filter.toLowerCase();
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
        bold: true,
        selected: project.id === currentProjectId,
        onExpand: this.onExpandProject.bind(this, project),
        onContextMenu: this.onProjectContextMenu.bind(this, project),
        items: this.getProjectBlocksRecursive(project.components),
        labelWidgets: [
          <img
            src="/images/ui/open.svg"
            onClick={this.onOpenProject.bind(this, project)}
            className="label-hover-bright"
          />

        ]
      }
    });

    return (
      <div>
        <InventorySearch searchTerm={this.state.filter}
                         disabled={false}
                         placeholder="Filter projects"
                         onSearchChange={this.handleFilterChange}/>
        <div className="inventory-project-tree">
          <Tree items={treeItems} />
        </div>
      </div>);
  }
}

function mapStateToProps(state, props) {
  const { projects, blocks } = state;

  return {
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
  uiShowMenu,
})(InventoryProjectTree);

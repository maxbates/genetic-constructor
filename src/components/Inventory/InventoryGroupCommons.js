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

import { block as blockDragType } from '../../constants/DragTypes';
import { SHARING_IN_PUBLIC_INVENTORY } from '../../constants/links';

import { blockStash } from '../../actions/blocks';
import { focusForceProject } from '../../actions/focus';
import { projectOpen, projectStash, projectClone } from '../../actions/projects';
import { commonsQuery, commonsRetrieveProject } from '../../actions/commons';
import { uiShowMenu } from '../../actions/ui';
import DnD from '../../containers/graphics/dnd/dnd';
import InventoryProjectTree from './InventoryProjectTree';
import Tree from '../ui/Tree';
import InventoryTabs from './InventoryTabs';

export class InventoryGroupCommons extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    commons: PropTypes.shape({
      projects: PropTypes.object.isRequired,
      versions: PropTypes.object.isRequired,
    }).isRequired,
    focus: PropTypes.object.isRequired,
    blockStash: PropTypes.func.isRequired,
    focusForceProject: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectStash: PropTypes.func.isRequired,
    projectClone: PropTypes.func.isRequired,
    commonsQuery: PropTypes.func.isRequired,
    commonsRetrieveProject: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
  };

  static onCommonsProjectDrag(snapshot, globalPoint) {
    //todo - should we do anything on dragging the project?
  }

  static onCommonsConstructDrag(block, globalPoint) {
    DnD.startDrag(InventoryProjectTree.makeDnDProxy(block), globalPoint, {
      item: block,
      type: blockDragType,
      source: 'inventory',
    });
  }

  constructor(props) {
    super(props);

    this.inventoryTabs = [
      { key: 'author', name: 'By Author' },
      { key: 'keyword', name: 'By Keyword' },
    ];
  }

  state = {
    snapshots: [],
    groupBy: 'author',
    filter: '',
  };

  componentDidMount() {
    //initial query, just get everything for now
    this.props.commonsQuery();
  }

  componentWillReceiveProps(nextProps, nextState) {
    if (this.props.commons !== nextProps.commons) {
      this.setState({
        snapshots: _(nextProps.commons.versions)
        .groupBy('projectId')
        .mapValues((projectSnapshots, projectId) => _.maxBy(projectSnapshots, 'version'))
        .values()
        .value(),
      });
    }
  }

  onTabSelect = (key) => {
    this.setState({ groupBy: key });
  };

  onClickSnapshot = (snapshot, isOpen) => {
    this.retrieveProject(snapshot.projectId)
    .then(roll => this.props.focusForceProject(roll.project));
  };

  onSnapshotContextMenu = (snapshot, evt) => {
    this.props.uiShowMenu([
      {
        text: 'Open Project',
        action: this.onOpenCommonsProject.bind(this, snapshot),
      },
      {
        text: 'Duplicate Project',
        action: () => {
          const { projectId } = snapshot;
          return this.retrieveAndStashProject(projectId)
          .then(() => {
            const cloned = this.props.projectClone(projectId, true);
            this.props.projectOpen(cloned.id);
          });
        },
      },
    ], {
      x: evt.pageX,
      y: evt.pageY,
    });
  };

  onOpenCommonsProject = (snapshot, evt) => {
    const projectId = snapshot.projectId;

    return this.retrieveAndStashProject(projectId)
    .then(() => this.props.projectOpen(projectId));
  };

  onFilterChange = (filter) => {
    this.setState({ filter });
  };

  //only allow looking at constructs
  getCommonsProjectBlocks = (projectId) => {
    const roll = this.props.commons.projects[projectId];
    if (!roll) {
      // don't fetch here, fetch on expand only
      return [];
    }

    return roll.project.components.map((componentId) => {
      const block = roll.blocks[componentId];
      return {
        block,
        text: block.getName(),
        items: [], //only one level allowed
        startDrag: globalPoint => {
          this.stashProject(roll);
          return InventoryGroupCommons.onCommonsConstructDrag(block, globalPoint);
        },
        stateKey: block.id,
      };
    });
  };

  retrieveProject(projectId) {
    const roll = this.props.commons.projects[projectId];
    return roll ?
      Promise.resolve(roll) :
      this.props.commonsRetrieveProject(projectId);
  }

  retrieveAndStashProject(projectId) {
    this.retrieveProject(projectId)
    .then(roll => this.stashProject(roll));
  }

  //need to stash project + blocks, since the commons is stored separately from projects and blocks
  //todo - perf = only store the blocks we need. Rollup should have method for getting this
  stashProject(roll) {
    this.props.projectStash(roll.project);
    this.props.blockStash(..._.values(roll.blocks));
    return roll;
  }

  render() {
    const { currentProjectId, focus } = this.props;
    const { snapshots, groupBy } = this.state;

    let grouped;
    if (groupBy === 'author') {
      grouped = _.groupBy(snapshots, 'tags.author');
    } else {
      //todo - perf - this will be really slow with lots of projects
      const allKeywords = _.union(_.flatMap(snapshots, _.property('keywords')));
      grouped = _.reduce(
        allKeywords,
        (acc, key) => Object.assign(acc, { [key]: _.filter(snapshots, snap => _.includes(snap.keywords, key)) }),
        {},
      );
    }

    //todo - use grouped

    const treeItems = snapshots.map(snapshot => ({
      text: snapshot.tags.projectName || 'Project Name',
      bold: true,
      selected: currentProjectId === snapshot.projectId,
      selectedAlt: focus.forceProject && snapshot.projectId === focus.forceProject.id,
      onClick: isOpen => this.onClickSnapshot(snapshot, open),
      onContextMenu: evt => this.onSnapshotContextMenu(snapshot, evt),
      // startDrag: globalPoint => InventoryGroupCommons.onCommonsProjectDrag(snapshot, globalPoint),
      items: this.getCommonsProjectBlocks(snapshot.projectId),
      labelWidgets: [
        <img
          key="open"
          role="presentation"
          src="/images/ui/open.svg"
          onClick={evt => this.onOpenCommonsProject(snapshot, evt)}
          className="label-hover-bright"
        />,
      ],
    }));

    const currentList = <Tree items={treeItems} />;

    return (
      <div className="InventoryGroup-content InventoryGroupCommons">
        <div className="InventoryGroup-banner">
          Share and reuse content. <a href={SHARING_IN_PUBLIC_INVENTORY} target="_blank" rel="noopener noreferrer">Learn
          more...</a>
        </div>
        <InventoryTabs
          tabs={this.inventoryTabs}
          activeTabKey={groupBy}
          onTabSelect={tab => this.onTabSelect(tab.key)}
        />
        <div className="InventoryGroup-contentInner no-vertical-scroll">
          {currentList}
        </div>
      </div>
    );
  }
}

export default connect((state, props) => ({
  commons: state.commons,
  focus: state.focus,
}), {
  blockStash,
  focusForceProject,
  projectStash,
  projectOpen,
  commonsQuery,
  commonsRetrieveProject,
  projectClone,
  uiShowMenu,
})(InventoryGroupCommons);

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
import { focusPrioritize, focusForceProject, focusForceBlocks } from '../../actions/focus';
import { projectLoad, projectOpen, projectStash, projectClone } from '../../actions/projects';
import { projectGet } from '../../selectors/projects';
import { commonsQuery, commonsRetrieveProject } from '../../actions/commons';
import { uiShowMenu, inspectorSelectTab, inspectorToggleVisibility } from '../../actions/ui';
import DnD from '../../containers/graphics/dnd/dnd';
import InventoryProjectTree from './InventoryProjectTree';
import Tree from '../ui/Tree';
import Spinner from '../ui/Spinner';
import InventoryTabs from './InventoryTabs';

export class InventoryGroupCommons extends Component {
  static propTypes = {
    currentProjectId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    commons: PropTypes.shape({
      projects: PropTypes.object.isRequired,
      versions: PropTypes.object.isRequired,
    }).isRequired,
    projects: PropTypes.object.isRequired,
    focus: PropTypes.object.isRequired,
    blockStash: PropTypes.func.isRequired,
    focusPrioritize: PropTypes.func.isRequired,
    focusForceProject: PropTypes.func.isRequired,
    focusForceBlocks: PropTypes.func.isRequired,
    projectLoad: PropTypes.func.isRequired,
    projectGet: PropTypes.func.isRequired,
    projectOpen: PropTypes.func.isRequired,
    projectStash: PropTypes.func.isRequired,
    projectClone: PropTypes.func.isRequired,
    commonsQuery: PropTypes.func.isRequired,
    commonsRetrieveProject: PropTypes.func.isRequired,
    uiShowMenu: PropTypes.func.isRequired,
    inspectorToggleVisibility: PropTypes.func.isRequired,
    inspectorSelectTab: PropTypes.func.isRequired,
  };

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
    loading: true,
    snapshots: [],
    groupBy: 'author',
    filter: '',
  };

  componentDidMount() {
    this.setSnapshots(this.props.commons.versions);

    //initial query on load, just get everything for now
    this.props.commonsQuery()
    .then(() => this.setState({ loading: false }));
  }

  componentWillReceiveProps(nextProps, nextState) {
    if (this.props.commons !== nextProps.commons) {
      this.setSnapshots(nextProps.commons.versions);
    }
  }

  onTabSelect = (key) => {
    this.setState({ groupBy: key });
  };

  onClickSnapshot = (snapshot, isOpen) => {
    this.retrieveProject(snapshot)
    .then((roll) => {
      if (snapshot.projectId === this.props.currentProjectId) {
        this.props.focusPrioritize('project');
      } else {
        this.props.focusForceProject(roll.project);
      }

      this.props.inspectorToggleVisibility(true);
      this.props.inspectorSelectTab('Information');
    });
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
          //could use Rollup.clone() instead, but this is fine, and sends the right action this way.. just adds an extra project to the store
          return this.retrieveAndStashProject(snapshot)
          .then(() => {
            const cloned = this.props.projectClone(projectId);
            this.props.projectOpen(cloned.project.id);
          });
        },
      },
    ], {
      x: evt.pageX,
      y: evt.pageY,
    });
  };

  onOpenCommonsProject = (snapshot, evt) => {
    const { projectId } = snapshot;

    return this.retrieveAndStashProject(snapshot)
    .then(() => this.props.projectOpen(projectId));
  };

  onFilterChange = (filter) => {
    this.setState({ filter });
  };

  //only allow looking at constructs
  getCommonsProjectBlocks = (snapshot) => {
    const { projectId } = snapshot;

    //need to check projects section as well, in case the user owns the project and its already loaded
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
        testid: block.id,
        items: [], //only one level allowed
        selectedAlt: this.props.focus.forceBlocks[0] === block,
        onClick: () => this.props.focusForceBlocks([block]),
        startDrag: (globalPoint) => {
          this.stashProject(roll);
          return InventoryGroupCommons.onCommonsConstructDrag(block, globalPoint);
        },
        stateKey: block.id,
      };
    });
  };

  setSnapshots(versions) {
    this.setState({
      snapshots: _(versions)
      .groupBy('projectId')
      .mapValues((projectSnapshots, projectId) => _.maxBy(projectSnapshots, 'version'))
      .values()
      .value(),
    });
  }

  retrieveProject(snapshot) {
    const { owner, projectId } = snapshot;

    const roll = this.props.commons.projects[projectId];
    if (roll) {
      return Promise.resolve(roll);
    }

    const userOwnsProject = this.props.userId === owner;

    return userOwnsProject ?
      this.props.projectLoad(projectId) :
      this.props.commonsRetrieveProject(projectId);
  }

  retrieveAndStashProject(snapshot) {
    return this.retrieveProject(snapshot)
    .then(roll => this.stashProject(roll));
  }

  //need to stash project + blocks, since the commons is stored separately from projects and blocks
  //todo - perf = only store the blocks we need. Rollup has a method for getting this
  stashProject(roll, force = false) {
    // assume that once in the store, we're good
    // if force, note that will overwrite the user's project to the locked one
    if (force !== true) {
      const projectId = roll.project.id;
      try {
        this.props.projectGet(projectId);
        return;
      } catch (err) {
        //not retrieved already, continue
      }
    }

    this.props.projectStash(roll.project);
    this.props.blockStash(..._.values(roll.blocks));
    return roll;
  }

  createGroupedSnapshots() {
    const { snapshots, groupBy } = this.state;

    if (groupBy === 'author') {
      //group by owner ID, since users may have the same name
      return _.groupBy(snapshots, 'owner');
    }

    // reduce, for each keyword, get all matching projects
    //todo - perf - this will be really slow with lots of projects - should use map and fetch lazily
    const allKeywords = _.union(_.flatMap(snapshots, _.property('keywords')));
    return _.reduce(
      allKeywords,
      (acc, key) => Object.assign(acc, { [key]: _.filter(snapshots, snap => _.includes(snap.keywords, key)) }),
      {},
    );
  }

  createProjectSnapshotTrees(snapshots) {
    const { currentProjectId, focus } = this.props;

    return snapshots.map(snapshot => ({
      text: snapshot.tags.projectName || 'Untitled Project',
      testid: `commons/${snapshot.projectId}/${snapshot.owner}`,
      bold: false,
      selected: currentProjectId === snapshot.projectId,
      selectedAlt: focus.forceProject && snapshot.projectId === focus.forceProject.id,
      onClick: isOpen => this.onClickSnapshot(snapshot, isOpen),
      onContextMenu: evt => this.onSnapshotContextMenu(snapshot, evt),
      items: this.getCommonsProjectBlocks(snapshot),
      showArrowWhenEmpty: true,
      labelWidgets: [
        <img
          key="open"
          role="presentation"
          src="/images/ui/open.svg"
          data-testid={`commonsopen/${snapshot.projectId}`}
          onClick={evt => this.onOpenCommonsProject(snapshot, evt)}
          className="label-hover-bright"
        />,
      ],
    }));
  }

  render() {
    const { loading, groupBy } = this.state;
    const grouped = this.createGroupedSnapshots();

    const treeItems = _.map(grouped, (groupSnapshots, key) => {
      const innerItems = this.createProjectSnapshotTrees(groupSnapshots);

      //get text here to handle scenario fo users with same name
      const text = (groupBy === 'author') ?
        groupSnapshots[0].tags.author :
        key;

      return {
        text,
        selected: groupBy === 'author' && key === this.props.userId,
        items: innerItems,
        testid: `commons/${key}`,
      };
    });

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
          {(loading && !treeItems.length) && <Spinner />}
          {(!loading && !treeItems.length) && (
            <p className="InventoryGroup-banner">No published projects</p>
          )}
          {currentList}
        </div>
      </div>
    );
  }
}

export default connect((state, props) => ({
  userId: state.user.userid,
  commons: state.commons,
  projects: state.commons,
  focus: state.focus,
}), {
  blockStash,
  focusPrioritize,
  focusForceProject,
  focusForceBlocks,
  projectGet,
  projectStash,
  projectOpen,
  projectLoad,
  commonsQuery,
  commonsRetrieveProject,
  projectClone,
  uiShowMenu,
  inspectorToggleVisibility,
  inspectorSelectTab,
})(InventoryGroupCommons);

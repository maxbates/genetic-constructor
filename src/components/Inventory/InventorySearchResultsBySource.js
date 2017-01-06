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

import { block as blockDragType } from '../../constants/DragTypes';
import { registry } from '../../inventory/registry';
import InventoryList from './InventoryList';
import '../../styles/InventorySearchResultGroup.css';

export default class InventorySearchResultsBySource extends Component {
  static propTypes = {
    searchResults: PropTypes.object.isRequired,
    sourcesVisible: PropTypes.object.isRequired,
    onListGroupToggle: PropTypes.func.isRequired,
    onItemSelect: PropTypes.func.isRequired,
    onItemDrop: PropTypes.func.isRequired,
    onListGroupAction: PropTypes.func.isRequired,
  };

  handleListGroupAction(evt, key) {
    evt.preventDefault();
    this.props.onListGroupAction(key);
  }

  render() {
    const { searchResults, sourcesVisible, onItemSelect, onItemDrop } = this.props;

    return (
      <div className="InventorySearchResultGroup">
        {Object.keys(searchResults).map((key) => {
          const name = registry[key].name;
          const results = searchResults[key];

          const moreResults = Number.isInteger(results.count) ?
            results.length < results.count :
            results.length % results.parameters.entries === 0;
          const actionVisible = results.length > 0 && moreResults && sourcesVisible[key];
          const loadMore = actionVisible
          ? <a
            onClick={(evt) => {
              this.handleListGroupAction(evt, key);
            }}
            className="InventorySearch-loadmore">Load more...</a>
          : null;

          return (
              <div key={key}>
                {loadMore}
                <InventoryList inventoryType={blockDragType}
                               onDrop={(item) => onItemDrop(key, item)}
                               onSelect={(item) => onItemSelect(key, item)}
                               items={results}
                               dataAttributePrefix={`searchresult ${name}`}/>
              </div>
          );
        })}
      </div>
    );
  }
}

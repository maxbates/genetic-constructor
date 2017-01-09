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
import { inventorySearch, inventorySetSources, inventorySearchPaginate, inventoryToggleSourceVisible } from '../../actions/inventory';
import InventorySearch from './InventorySearch';
import InventorySearchResults from './InventorySearchResults';

export class InventoryGroupSearch extends Component {
  static propTypes = {
    searchTerm: PropTypes.string.isRequired,
    sourcesToggling: PropTypes.bool.isRequired,
    searching: PropTypes.bool.isRequired,
    source: PropTypes.string.isRequired,
    sourcesVisible: PropTypes.object.isRequired,
    searchResults: PropTypes.object.isRequired,
    inventorySearch: PropTypes.func.isRequired,
    inventorySearchPaginate: PropTypes.func.isRequired,
    inventorySetSources: PropTypes.func.isRequired,
    inventoryToggleSourceVisible: PropTypes.func.isRequired,
    blockStash: PropTypes.func.isRequired,
  };

  /**
   * necessary to set the initial search source
   */
  componentWillMount() {
    this.props.inventorySetSources([this.props.source]);
    this.handleSearchChange(this.props.searchTerm);
  }

  /**
   * update the search source
   * @param nextProps
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.source !== this.props.source) {
      this.props.inventorySetSources([nextProps.source]);
      this.handleSearchChange(this.props.searchTerm);
    }
  }

  handleLoadMore = (source) => {
    this.props.inventorySearchPaginate(source);
  };

  handleSearchChange = (searchTerm) => {
    const { inventorySearch } = this.props;
    inventorySearch(searchTerm);
  };

  render() {
    const { searchTerm, sourcesToggling, searching, searchResults, sourcesVisible } = this.props;
    return (
      <div className={'InventoryGroup-content InventoryGroupSearch'}>
        <InventorySearch
          searchTerm={searchTerm}
          isSearching={searching}
          disabled={sourcesToggling}
          onSearchChange={value => this.handleSearchChange(value)}
        />

        {!sourcesToggling && (
          <InventorySearchResults
            searchTerm={searchTerm}
            sourcesToggling={sourcesToggling}
            sourcesVisible={sourcesVisible}
            searching={searching}
            searchResults={searchResults}
            blockStash={this.props.blockStash}
            loadMore={source => this.handleLoadMore(source)}
            inventoryToggleSourceVisible={this.props.inventoryToggleSourceVisible}
          />
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return state.inventory;
}

export default connect(mapStateToProps, {
  inventorySearch,
  inventorySearchPaginate,
  inventorySetSources,
  inventoryToggleSourceVisible,
  blockStash,
})(InventoryGroupSearch);

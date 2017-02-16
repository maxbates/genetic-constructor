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
import _ from 'lodash';

import { snapshotsListKeywords } from '../../middleware/snapshots';
import FormSelect from '../formElements/FormSelect';

export default class FormKeywords extends Component {
  static propTypes = {
    keywords: PropTypes.arrayOf(PropTypes.string).isRequired,
    onChange: PropTypes.func.isRequired,
  }

  state = {
    keywordListLoading: true,
    keywordList: [],
  };

  componentDidMount() {
    snapshotsListKeywords().then((keywordsMap) => {
      this.setState({
        keywordList: _.map(keywordsMap, (number, keyword) => ({ value: keyword, label: keyword })),
        keywordListLoading: false,
      });
    });
  }

  render() {
    const { keywords, onChange } = this.props;
    const { keywordList, keywordListLoading } = this.state;

    const cleanInput = input => input.toLowerCase().trim();
    const setKeywords = (values) => {
      onChange(values.map(({ value }) => cleanInput(value)));
    };

    // ensure new values are lowercase when created
    // Annoyingly, value.value and option.value must match exactly for tags to render properly
    // https://github.com/JedWatson/react-select/blob/master/src/Select.js#L593
    const newOptionCreator = ({ label, labelKey, valueKey }) => ({
      [valueKey]: cleanInput(label),
      [labelKey]: cleanInput(label),
    });

    return (
      <FormSelect
        name="keywords"
        multi
        value={keywords}
        options={keywordList}
        isLoading={keywordListLoading}
        valueRenderer={({ value }) => cleanInput(value)}
        optionRenderer={({ value }) => cleanInput(value)}
        newOptionCreator={newOptionCreator}
        onInputChange={cleanInput}
        onChange={setKeywords}
        isOptionUnique={({ option, options, valueKey }) => !_.some(options, opt => cleanInput(opt.value) === cleanInput(option.value))}
        ignoreAccents
        ignoreCase
        placeholder="Enter keywords to help people find your project"
        noResultsText="No results found (duplicates not allowed)"
        promptTextCreator={label => `Create keyword ${cleanInput(label)}`}
      />
    );
  }
}
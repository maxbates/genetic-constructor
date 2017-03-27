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

import {
  blockFreeze,
  blockSetHidden,
  blockSetListBlock,
  blockSetRole,
} from '../../actions/blocks';
import '../../styles/TemplateRules.css';
import Checkbox from '../formElements/Checkbox';

export class TemplateRules extends Component {
  static propTypes = {
    block: PropTypes.object.isRequired,
    readOnly: PropTypes.bool.isRequired,
    isConstruct: PropTypes.bool.isRequired, //this refers to parent block, not top-level
    blockSetListBlock: PropTypes.func.isRequired,
    blockSetHidden: PropTypes.func.isRequired,
    blockSetRole: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.rules = [
      ['hidden',
        'Hidden',
        value => this.props.blockSetHidden(this.props.block.id, value),
        () => this.props.isConstruct],
      ['list',
        'List Block',
        (value) => {
          this.props.blockSetListBlock(this.props.block.id, value);
          // if no symbol and becoming a list block then set the list block symbol
          if (value && !this.props.block.rules.role) {
            this.props.blockSetRole(this.props.block.id, 'list');
          }
          if (!value && this.props.block.rules.role === 'list') {
            this.props.blockSetRole(this.props.block.id, null);
          }
        },
        () => this.props.isConstruct || this.props.block.isConstruct() || this.props.block.hasSequence()],
    ];
  }

  render() {
    const { isConstruct, readOnly, block } = this.props;

    return (
      <div className="TemplateRules">
        {this.rules.map(([rule, name, func, hideIf = () => {}]) => {
          if (hideIf() === true) { return null; }
          return (
            <div
              className="TemplateRules-rule"
              key={rule}
            >
              <Checkbox
                checked={block.rules[rule]}
                disabled={readOnly || (rule === 'frozen' && isConstruct)}
                onChange={(value) => {
                  if (!readOnly) {
                    func(value);
                  }
                }}
              />
              <span className="TemplateRules-name">{name}</span>
            </div>
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({});

export default connect(mapStateToProps, {
  blockFreeze,
  blockSetListBlock,
  blockSetHidden,
  blockSetRole,
})(TemplateRules);

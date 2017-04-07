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
  blockSetDescription,
  blockRename,
  blockSetColor,
  blockSetPalette,
  blockSetRole,
  blockSetFixed,
} from '../../actions/blocks';
import Block from '../../models/Block';
import { abort, commit, transact } from '../../store/undo/actions';
import InputSimple from '../formElements/InputSimple';
import ColorPicker from './../ui/ColorPicker';
import PalettePicker from './../ui/PalettePicker';
import SBOLPicker from './../ui/SBOLPicker';
import BlockNotes from './BlockNotes';
import BlockSource from './BlockSource';
import BlockAttribution from './BlockAttribution';
import InspectorRow from './InspectorRow';
import ListOptions from './ListOptions';
import TemplateRules from './TemplateRules';
import { getPaletteName } from '../../utils/color/index';
import '../../styles/InspectorBlock.css';

export class InspectorBlock extends Component {
  static propTypes = {
    readOnly: PropTypes.bool.isRequired,
    instances: PropTypes.arrayOf((propValue, key) => {
      const instance = propValue[key];
      if (!(Block.validate(instance) && instance instanceof Block)) {
        return new Error(`Must pass valid instances of blocks to the inspector, got ${JSON.stringify(instance)}`);
      }
    }).isRequired,
    construct: PropTypes.object,
    overrides: PropTypes.shape({
      color: PropTypes.string,
      role: PropTypes.string,
    }).isRequired,
    project: PropTypes.object.isRequired,
    userOwnsProject: PropTypes.bool.isRequired,
    forceIsConstruct: PropTypes.bool,
    blockSetColor: PropTypes.func.isRequired,
    blockSetPalette: PropTypes.func.isRequired,
    blockSetRole: PropTypes.func.isRequired,
    blockRename: PropTypes.func.isRequired,
    blockSetDescription: PropTypes.func.isRequired,
    blockSetFixed: PropTypes.func.isRequired,
    transact: PropTypes.func.isRequired,
    commit: PropTypes.func.isRequired,
    abort: PropTypes.func.isRequired,
  };

  static defaultProps = {
    forceIsConstruct: false,
  };

  state = {
    colorSymbolText: 'Color & Symbol',
  };

  setBlockName = (name) => {
    this.props.instances.forEach((block) => {
      this.props.blockRename(block.id, name);
    });
  };

  setBlockDescription = (description) => {
    this.props.instances.forEach((block) => {
      this.props.blockSetDescription(block.id, description);
    });
  };

  setColorSymbolText = (str) => {
    this.setState({ colorSymbolText: str || 'Color & Symbol' });
  };

  selectColor = (colorIndex) => {
    this.startTransaction();
    this.props.instances.forEach((block) => {
      this.props.blockSetColor(block.id, colorIndex);
    });
    this.endTransaction();
  };

  selectPalette = (paletteName) => {
    this.props.blockSetPalette(this.props.construct.id, paletteName);
  };

  selectSymbol = (symbol) => {
    this.startTransaction();
    this.props.instances.forEach((block) => {
      this.props.blockSetRole(block.id, symbol);
    });
    this.endTransaction();
  };

  startTransaction = () => {
    this.props.transact();
  };

  endTransaction = (shouldAbort = false) => {
    if (shouldAbort === true) {
      this.props.abort();
      return;
    }
    this.props.commit();
  };

  isConstruct() {
    const { project, instances, forceIsConstruct } = this.props;
    return forceIsConstruct === true || (instances.length === 1 && project && project.components.indexOf(instances[0].id) >= 0);
  }

  /**
   * color of selected instance or null if multiple blocks selected
   */
  currentColor() {
    const { instances, overrides } = this.props;
    let color;
    if (overrides.color) {
      color = overrides.color;
    }
    if (instances.length === 1) {
      color = instances[0].metadata.color;
    }
    if (isFinite(color)) {
      return color;
    }
    return -1;
  }

  /**
   * role symbol of selected instance or null if multiple blocks selected
   */
  currentRoleSymbol() {
    const { instances, overrides } = this.props;
    if (overrides.role) {
      return overrides.role;
    }
    if (instances.length === 1) {
      return instances[0].getRole(false);
    }
    return null;
  }

  /**
   * current name of instance or null if multi-select
   */
  currentName(useGetName = true) {
    if (this.props.instances.length === 1) {
      const defaultName = this.isConstruct() ? 'New Construct' : null;
      return useGetName ? this.props.instances[0].getName(defaultName) : this.props.instances[0].metadata.name;
    }
    return '';
  }

  /**
   * current name of instance or null if multi-select
   */
  currentDescription() {
    if (this.props.instances.length === 1) {
      return this.props.instances[0].metadata.description || '';
    }
    return '';
  }

  allBlocksWithSequence() {
    return this.props.instances.every(instance => !!instance.sequence.length);
  }

  currentSequenceLength() {
    if (this.allBlocksWithSequence()) {
      const reduced = this.props.instances.reduce((acc, instance) => acc + (instance.sequence.length || 0), 0);
      return `${reduced} bp`;
    }
    return this.props.instances.length > 1 ?
      'Incomplete Sketch' :
      'No Sequence';
  }

  currentAnnotations() {
    if (this.props.instances.length > 1) {
      return [];
    } else if (this.props.instances.length === 1) {
      return this.props.instances[0].sequence.annotations;
    }
    return [];
  }

  currentSource() {
    const lenInstances = this.props.instances.length;
    const firstBlock = this.props.instances[0];
    const firstSource = firstBlock.source;
    const { id: firstId, source: firstName } = firstSource;
    const firstHasSource = !!firstName;

    if (firstHasSource && (lenInstances === 1 ||
      this.props.instances.every(block => block.source.id === firstId && block.source.source === firstName))) {
      return (<BlockSource block={firstBlock} />);
    }
    if (lenInstances > 1) {
      return (<p>Multiple Sources</p>);
    }
    return null;
  }

  render() {
    const { instances, construct, readOnly, userOwnsProject } = this.props;
    const singleInstance = instances.length === 1;
    const isConstruct = this.isConstruct();
    const isParentBlock = singleInstance && instances[0].isConstruct();
    const isBackbone = singleInstance && instances[0].rules.role === 'backbone';
    const isList = singleInstance && instances[0].isList();
    const isFrozen = (construct && construct.isFrozen()) || instances.some(inst => inst.isFrozen());
    const isFixed = (construct && construct.isFixed()) || instances.some(inst => inst.isFixed());

    const cannotEdit = readOnly || isFrozen || isFixed || !userOwnsProject;

    const inputKey = instances.map(inst => inst.id).join(',');

    const palette = getPaletteName(construct ? construct.metadata.palette || this.props.project.metadata.palette : null);

    const defaultType = isConstruct ? 'Construct' : 'Block';
    const type = singleInstance ? instances[0].getType(defaultType) : 'Blocks';

    const currentSourceElement = this.currentSource();
    const annotations = this.currentAnnotations();

    const hasSequence = this.allBlocksWithSequence();
    const hasNotes = singleInstance && Object.keys(instances[0].notes).length > 0;

    return (
      <div className="InspectorContent InspectorContentBlock">

        <InspectorRow heading={type}>
          <InputSimple
            refKey={inputKey}
            placeholder={this.currentName(true) || 'Enter a name'}
            readOnly={cannotEdit}
            onChange={this.setBlockName}
            onFocus={this.startTransaction}
            onBlur={this.endTransaction}
            onEscape={() => this.endTransaction(true)}
            maxLength={64}
            value={this.currentName(false)}
          />
        </InspectorRow>

        <InspectorRow heading="Description">
          <InputSimple
            refKey={`${inputKey}desc`}
            placeholder="Enter a description"
            useTextarea
            readOnly={cannotEdit}
            onChange={this.setBlockDescription}
            onFocus={this.startTransaction}
            onBlur={this.endTransaction}
            onEscape={() => this.endTransaction(true)}
            maxLength={1024}
            value={this.currentDescription()}
          />
        </InspectorRow>

        <InspectorRow
          heading="Protected"
          condition={singleInstance}
          glyphUrl="/images/ui/lock.svg"
          hasSwitch
          switchDisabled={readOnly || isFrozen || !userOwnsProject}
          onToggle={state => this.props.blockSetFixed(instances[0].id, state)}
          forceActive={isFixed}
        />

        {singleInstance && (
          <BlockAttribution
            block={instances[0]}
            readOnly={cannotEdit}
          />
        )}

        <InspectorRow
          heading={`${type} Metadata`}
          hasToggle
          condition={hasNotes}
        >
          <BlockNotes notes={instances[0].notes} />
        </InspectorRow>

        <InspectorRow
          heading="Source"
          condition={!!currentSourceElement}
        >
          {currentSourceElement}
        </InspectorRow>

        <InspectorRow
          heading={`${type} Rules`}
          condition={singleInstance && !isConstruct}
        >
          <TemplateRules
            block={instances[0]}
            readOnly={cannotEdit}
            isConstruct={isParentBlock}
          />
        </InspectorRow>

        <InspectorRow
          heading="Sequence Length"
          condition={hasSequence}
        >
          <p><strong>{this.currentSequenceLength()}</strong></p>
        </InspectorRow>

        <InspectorRow
          heading={`Color Palette: ${palette}`}
          hasToggle
          condition={isConstruct}
        >
          <PalettePicker
            paletteName={palette}
            onSelectPalette={this.selectPalette}
            readOnly={cannotEdit}
          />
        </InspectorRow>

        <InspectorRow
          heading={this.state.colorSymbolText}
        >
          <div className="color-symbol">
            <ColorPicker
              setText={this.setColorSymbolText}
              current={this.currentColor()}
              readOnly={cannotEdit}
              paletteName={palette}
              onSelectColor={this.selectColor}
            />
            {(singleInstance && !isConstruct && !isBackbone) ?
              (
                <SBOLPicker
                  setText={this.setColorSymbolText}
                  current={this.currentRoleSymbol()}
                  readOnly={cannotEdit}
                  onSelect={this.selectSymbol}
                />
              ) :
              null}
          </div>
        </InspectorRow>

        <InspectorRow
          heading="List Options"
          condition={isList}
        >
          <ListOptions
            disabled={isFrozen}
            toggleOnly={isFixed}
            block={instances[0]}
          />
        </InspectorRow>

        <InspectorRow
          heading="Annotations"
          condition={annotations.length > 0}
        >
          <div className="InspectorContentBlock-Annotations">
            {annotations.map((annotation, idx) => (
              <span
                className="InspectorContentBlock-Annotation"
                key={idx}
              >
                {annotation.name || annotation.description || '?'}
              </span>
            ))}
          </div>
        </InspectorRow>

      </div>
    );
  }
}

export default connect(null, {
  blockSetColor,
  blockSetPalette,
  blockSetRole,
  blockRename,
  blockSetDescription,
  blockSetFixed,
  transact,
  commit,
  abort,
})(InspectorBlock);

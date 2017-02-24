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
import moment from 'moment';

import { blockAttribute } from '../../actions/blocks';
import Switch from '../ui/Switch';
import FormText from '../formElements/FormText';
import InspectorRow from './InspectorRow';

import '../../styles/BlockAttribution.css';

export class BlockAttribution extends Component {
  static propTypes = {
    block: PropTypes.shape({
      attribution: PropTypes.arrayOf(PropTypes.shape({
        owner: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        time: PropTypes.number.isRequired,
      })).isRequired,
    }).isRequired,
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    blockAttribute: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    const lastAttribution = props.block.attribution[props.block.attribution.length - 1];
    const userOwnsLastAttribution = lastAttribution && lastAttribution.owner === props.userId;

    this.state = {
      text: userOwnsLastAttribution ? lastAttribution.text : props.userName,
    };
  }

  onSwitch = (switchOn) => {
    const value = !switchOn ? null : undefined;
    this.updateAttribution(value);
  };

  //todo - need update attribution on blur
  updateAttribution(forceValue) {
    const { block, blockAttribute } = this.props;
    const { text } = this.state;

    //might be null
    const attributionValue = forceValue !== undefined ? forceValue : text;
    blockAttribute(block.id, attributionValue);
  }

  render() {
    const { userName, userId, block } = this.props;

    const [lastAttribution, ...otherAttributions] = block.attribution.slice().reverse();
    const userOwnsLastAttribution = !!lastAttribution && lastAttribution.owner === userId;

    return (
      <InspectorRow
        heading="Attribution License"
        glyphUrl="/images/ui/cc-off.svg"
        hasSwitch
        onToggle={this.onSwitch}
        forceActive={userOwnsLastAttribution}
      >
        <div className="BlockAttribution-inner">
          {userOwnsLastAttribution && (
            <FormText
              value={this.state.text}
              required
              onChange={evt => this.setState({ text: evt.target.value || userName })}
            />)}

          {otherAttributions.length > 0 && (
            <div className="BlockAttribution-attributions">
              {otherAttributions.map(attribution => (
                <span className="BlockAttribution-attribution">
                  {`${attribution.text} (${moment(attribution.time).format('MMM DD YYYY')})`}
                </span>
              ))}
            </div>
          )}
        </div>
      </InspectorRow>
    );
  }
}

export default connect(state => ({
  userId: state.user.userid,
  userName: `${state.user.firstName} ${state.user.lastName}`,
}), {
  blockAttribute,
})(BlockAttribution);

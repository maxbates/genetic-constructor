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
import React, { PropTypes } from 'react';

import '../../styles/InspectorDetailSection.css';

export default function InspectorDetailSection(props) {
  return (
    <div className={`InspectorDetailSection${props.indented ? ' indented' : ''}`}>
      {props.items.map(({ key, value }) => {
        if (!value) {
          return null;
        }
        return (<div className="row" key={key}>
          <div className="key">{key}</div>
          <div className={`value${props.indented ? ' indented' : ''}`}>{value}</div>
        </div>);
      })}
    </div>
  );
}

InspectorDetailSection.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  })).isRequired,
  indented: PropTypes.bool,
  inline: PropTypes.bool,
};

InspectorDetailSection.defaultProps = {
  items: [],
  indented: false,
  inline: false,
};

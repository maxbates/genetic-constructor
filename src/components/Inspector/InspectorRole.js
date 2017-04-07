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

import symbols, { symbolMap } from '../../inventory/roles';
import PickerItem from '../ui/PickerItem';
import InputSimple from '../formElements/InputSimple';
import InspectorRow from './InspectorRow';

export default function InspectorRole(props) {
  const { roleId, readOnly } = props;
  const instance = symbols.find(symbol => symbol.id === roleId);

  return (
    <div className="InspectorContent InspectorContentRole">

      <InspectorRow heading="Role Name">
        <InputSimple
          readOnly={readOnly}
          value={instance.name}
        />
      </InspectorRow>

      <InspectorRow heading="Glyph">
        <PickerItem
          readOnly
          svg={instance.id}
        />
      </InspectorRow>

    </div>
  );
}

InspectorRole.propTypes = {
  roleId: (props, propName) => {
    if (!symbolMap[props[propName]]) {
      return new Error('must pass a valid Role Operator');
    }
  },
  readOnly: PropTypes.bool.isRequired,
};

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

//todo - Drag and Drop
import DnD from '../../containers/graphics/dnd/dnd';
import {
  block as blockDragType,
  gsl as gslDragType,
  role as roleDragType,
} from '../../constants/DragTypes';

export default class InventorySideGroup extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired, //todo
    type: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    setActive: PropTypes.func.isRequired,
  };

  render() {
    const { title, type, icon, isActive, setActive, ...rest } = this.props;

    return (
      <div className={'InventorySideGroup' + (isActive ? ' active' : '')}
           onClick={setActive}>
        <div className="InventorySideGroup-icon"
             title={title}>
          {icon}
        </div>
      </div>
    );
  }
}

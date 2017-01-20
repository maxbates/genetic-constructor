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

export default function ModalFooter(props) {
  const { actions } = props;

  return (
    <div className="Modal-footer">
      <div className="Modal-actions">
        {actions.map((action, index) => {
          const { disabled, text, onClick } = action;
          const active = typeof disabled === 'function' ?
            disabled() !== true :
            disabled !== true;
          const classes = `Modal-action${active ? '' : ' disabled'}`;
          return (
            <a
              key={index}
              className={classes}
              onClick={(evt) => {
                if (active) {
                  onClick(evt);
                }
              }}
            >
              {text}
            </a>
          );
        })}
      </div>
    </div>
  );
}

ModalFooter.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  })).isRequired,
};

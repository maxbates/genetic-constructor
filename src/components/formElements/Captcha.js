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

//we have our custom captcha component because the existing ones dont handle invisible captchas (which is what we wanted for the registration modal)

import React, { PropTypes } from 'react';

export default function Captcha(props) {
  const styles = {
    width: '350px',
    height: '73px',
    backgroundColor: '#fafafa',
  };

  return (
    <div style={styles}></div>
  );
}

Captcha.propTypes = {
  onVerify: PropTypes.func.isRequired,
};

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

import ScrollToTop from './ScrollToTop';
import Header from './Header';
import Footer from './Footer';

if (process.env.BROWSER) {
  require('../styles/App.css'); //eslint-disable-line global-require
}

//wrap the page component in app chrome
export default function App({ children, ...otherProps }) {
  return (
    <ScrollToTop>
      <div className="App">
        <Header />
        {React.cloneElement(children, { ...otherProps })}
        <Footer />
      </div>
    </ScrollToTop>
  );
}

App.propTypes = {
  children: PropTypes.node.isRequired,
};

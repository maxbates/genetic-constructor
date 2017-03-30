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

import React from 'react';

//todo - handle when user is signed in. get the nav glyph from the main app

if (process.env.BROWSER) {
  require('../styles/Header.css'); //eslint-disable-line global-require
}

export default function Header() {
  return (
    <nav className="Header">
      <div className="Header-left">
        <a href="/" className="Header-logo" />
        <a className="Header-link" href="/#interfaceSection">Features</a>
        <a className="Header-link" href="/#trySectionTop">Pricing</a>
        <a className="Header-link" href="/#teamSection">Team</a>
        <a className="Header-link" href="https://docs.geneticconstructor.bionano.autodesk.com/docs">Docs</a>
        <a className="Header-link" href="https://autodeskbionano.blogspot.com/search/label/Genetic%20Constructor">Blog</a>
        <a className="Header-link active" href="https://autodeskbionano.blogspot.com/search/label/Genetic%20Constructor">Commons</a>
      </div>
      <div className="Header-right">
        <a className="Header-link" href="/homepage/signin">Sign In</a>
      </div>
    </nav>
  );
}

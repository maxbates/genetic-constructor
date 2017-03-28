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

export default function Footer() {
  return (
    <footer className="Footer">
      <div className="Footer-row Footer-links">
        <div className="Footer-column">
          <h4>Genetic Constructor</h4>

          <a
            href="https://geneticconstructor.readme.io/docs"
            target="_blank"
            rel="noopener noreferrer"
          >Documentation</a>
          <a href="/homepage/register">Create your account</a>
          <a href="/homepage/signin">Sign In</a>
          <a
            href="http://www.autodesk.com/company/legal-notices-trademarks/privacy-statement"
            target="_blank"
            rel="noopener noreferrer"
          >Privacy</a>
        </div>

        <div className="Footer-column">
          <h4>Products</h4>

          <a
            href="https://molviewer.com"
            target="_blank"
            rel="noopener noreferrer"
          >Molecule Viewer</a>
          <a
            href="http://molsim.bionano.autodesk.com/"
            target="_blank"
            rel="noopener noreferrer"
          >Molecular Simulation Toolkit</a>
          <a
            href="http://bionano.autodesk.com/"
            target="_blank"
            rel="noopener noreferrer"
          >The BioNano Team</a>
          <a
            href="http://www.autodesk.com/company"
            target="_blank"
            rel="noopener noreferrer"
          >About Autodesk</a>
        </div>

        <div className="Footer-column">
          <h4>Contact Us</h4>

          <a
            href="https://www.facebook.com/autodeskbionano"
            target="_blank"
            rel="noopener noreferrer"
          >Facebook</a>
          <a
            href="https://twitter.com/adskBioNano"
            target="_blank"
            rel="noopener noreferrer"
          >Twitter</a>
          <a
            href="https://www.youtube.com/channel/UC19GH6wqbQMnOe2fF4DZlZA"
            target="_blank"
            rel="noopener noreferrer"
          >YouTube</a>
          <a href="mailto:geneticconstructor@autodesk.com">Email us</a>
        </div>
      </div>

      <div className="Footer-row">
        <img
          src="/landing/assets/images/Autodesk.svg"
          width="150"
          alt="Autodesk Logo"
        />
        <p style={{ paddingTop: '1rem' }}>&copy; 2017</p>
      </div>
    </footer>
  );
}

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

//parses pseudoMd5 in form acde79489cad6a8da9cea[10:900]
const md5Regex = /([a-z0-9]+)(\[(\d+):(\d+?)\])?/;

export const validPseudoMd5 = (md5) => md5Regex.test(md5);

export const generatePseudoMd5 = (md5, start, end) => `${md5}[${start}:${end}]`;

//start and end will only be defined if byte range is specified
export const parsePseudoMd5 = (pseudoMd5) => {
  const [ original, hash, byteRange, start, end ] = pseudoMd5.match(md5Regex);
  return {
    original,
    hash,
    byteRange,
    start: parseInt(start, 10),
    end: parseInt(end, 10),
  };
};

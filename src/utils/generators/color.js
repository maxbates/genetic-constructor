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
export const colorMap = {
  '#e7aaa9': 'pink',
  '#D28482': 'red',
  '#E9BA9b': 'tangerine',
  '#efac7e': 'orange',
  '#EFD79A': 'gold',
  '#F1D26C': 'yellow',
  '#E4E480': 'sassafras',
  '#D3D34F': 'yellow green',
  '#9CC6C0': 'cerulean',
  '#6DA19C': 'teal',
  '#B1CED0': 'baby blue',
  '#65AAB1': 'blue',
  '#8EC78D': 'spring',
  '#53B15F': 'green',
  '#C5C4C1': 'light grey',
  '#A5A6A2': 'grey',
};

export const colors = Object.keys(colorMap);

let lastIndex = 0;
export default function color() {
  const next = colors[lastIndex];
  lastIndex = (lastIndex + 1) % colors.length;
  return next;
}

export function resetColorSeed() {
  lastIndex = 0;
}

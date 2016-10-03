import { merge } from 'lodash';
import Block from '../../src/models/Block';
import partList from './partList.json';

export default partList
  .map(part => Block.classless(merge({}, part, {rules: { frozen: true }})));

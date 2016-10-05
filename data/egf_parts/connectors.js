import { merge } from 'lodash';
import Block from '../../src/models/Block';
import connectorList from './connectorList.json';

export default connectorList
  .map(connector => Block.classless(merge({}, connector, {
    metadata: {
      color: '#bababa',
    },
    rules: {
      hidden: true,
      frozen: true,
    },
  })));

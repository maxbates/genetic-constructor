import invariant from 'invariant';
import * as egf from './egf/index';
import * as igem from './igem/index';
import * as ncbi from './ncbi/index';

export const registry = {
  egf,
  igem,
  ncbi,
};

export const register = (source) => {
  invariant(false, 'not supported yet');

  //todo - checks
  invariant(typeof source.get === 'function');
  invariant(typeof source.search === 'function');

  //todo - add to registry
};

export const getSources = () => Object.keys(registry);

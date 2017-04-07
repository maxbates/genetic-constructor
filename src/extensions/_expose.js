import { projectFileWrite as write } from '../actions/projects';
import { callExtensionApi as api } from '../middleware/extensions';
import { projectFileList as list, projectFileRead as read } from '../selectors/projects';
import { dispatch } from '../store/index';
import { isRegistered, onRegister } from './clientRegistry';
import { validRegion } from './regions';
import register from './register';

/**
 * `window.constructor.extensions`
 *
 * API Section for extensions
 * @module extensions
 * @memberOf module:constructor
 */
export default {
  register,
  api,
  files: {
    read: (...args) => dispatch(read(...args)),
    write: (...args) => dispatch(write(...args)),
    list: (...args) => dispatch(list(...args)),
  },
  isRegistered,
  onRegister,
  validRegion,
};

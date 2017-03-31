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
import { LOCATION_CHANGE } from 'react-router-redux';

import * as ActionTypes from '../../constants/ActionTypes';

export const initialState = {
  detailViewVisible: false,
  authenticationForm: 'none',
  authFormParams: {},
  showDNAImport: false,
  orderId: null,
  showAbout: false,
  gruntMessage: null,
  gruntTime: 5000,
  showGenBankImport: false,
  userWidgetVisible: true,
  spinMessage: '',
  inlineEditorCommit: null,
  inlineEditorCancel: null,
  inlineEditorPosition: null,
  showSaveError: false,
  showOrderForm: false,
  showReportError: false,
  showPartsCSVImport: false,
  listBlock: null,
  publishDialog: false,
  publishDialogVersion: undefined,
  unpublishDialog: false,
  unpublishDialogVersion: undefined,
  projectDeleteDialog: false,
};

export default function modals(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.UI_SHOW_AUTHENTICATION_FORM:
      const { authenticationForm, authFormParams } = action;
      //preserve params if not turned off explicitly (either params or the modal) - (e.g. trigger signin -> register form)
      const params = (!authFormParams || authenticationForm === 'none') ? authFormParams : Object.assign({}, state.authFormParams, authFormParams);
      return { ...state, authenticationForm, authFormParams: params };

    case ActionTypes.UI_SHOW_GENBANK_IMPORT:
      const { showGenBankImport } = action;
      return { ...state, showGenBankImport };

    case ActionTypes.UI_SHOW_PARTSCSV_IMPORT:
      const { showPartsCSVImport, listBlock } = action;
      return { ...state, showPartsCSVImport, listBlock };

    case ActionTypes.UI_SHOW_DNAIMPORT:
      const { showDNAImport } = action;
      return { ...state, showDNAImport };

    case ActionTypes.UI_SHOW_ORDER_FORM:
      const { showOrderForm, orderId } = action;
      return { ...state, showOrderForm, orderId };

    case ActionTypes.UI_SHOW_ABOUT:
      const { showAbout } = action;
      return { ...state, showAbout };

    case ActionTypes.DETAIL_VIEW_TOGGLE_VISIBILITY :
      const { nextState } = action;
      return { ...state, detailViewVisible: nextState };

    case ActionTypes.UI_SHOW_USER_WIDGET :
      const { userWidgetVisible } = action;
      return { ...state, userWidgetVisible };

    case ActionTypes.UI_SET_GRUNT :
      const { gruntMessage, gruntTime } = action;
      return { ...state, gruntMessage, gruntTime };

    case ActionTypes.UI_SHOW_MENU :
      const { menuItems, menuPosition, menuHat } = action;
      return { ...state, menuItems, menuPosition, menuHat };

    case ActionTypes.UI_OK_CANCEL:
      const { title, message, onOk, onCancel, okText, cancelText } = action;
      return {
        ...state,
        title,
        message,
        onOk,
        onCancel,
        okText,
        cancelText,
      };

    case ActionTypes.UI_SPIN:
      const { spinMessage } = action;
      return { ...state, spinMessage };

    case ActionTypes.UI_INLINE_EDITOR:
      const {
        inlineEditorCommit,
        inlineEditorValue,
        inlineEditorPosition,
        inlineEditorClassName,
        inlineEditorTarget,
      } = action;
      return {
        ...state,
        inlineEditorCommit,
        inlineEditorValue,
        inlineEditorPosition,
        inlineEditorClassName,
        inlineEditorTarget,
      };

    case ActionTypes.UI_SAVE_ERROR:
      return { ...state, showSaveError: true };

    case ActionTypes.UI_SHOW_REPORT_ERROR:
      const { modalState } = action;
      return { ...state, showReportError: modalState };

    case ActionTypes.UI_SHOW_PUBLISH_DIALOG:
      const { publishDialog, publishDialogVersion } = action;
      return { ...state, publishDialog, publishDialogVersion };

    case ActionTypes.UI_SHOW_UNPUBLISH_DIALOG:
      const { unpublishDialog, unpublishDialogVersion } = action;
      return { ...state, unpublishDialog, unpublishDialogVersion };

    case ActionTypes.UI_SHOW_PROJECT_DELETE_DIALOG:
      const { projectDeleteDialog } = action;
      return { ...state, projectDeleteDialog };

    case LOCATION_CHANGE :
      const toKeep = ['gruntMessage'].reduce((acc, field) => Object.assign(acc, { [field]: state[field] }), {});
      return Object.assign({}, initialState, toKeep);

    default :
      return state;
  }
}

import * as types from '../constants';

export default function reducer(state={ assets: [], }, actions) {
  switch (actions.type) {

    case types.SET_ASSET:
      return {
        ...state,
        assets: actions.assets
      }

    default:
      return state
  }
}

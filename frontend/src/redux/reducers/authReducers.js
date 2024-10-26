import * as types from '../constants';

export default function reducer(state={ auth: {}, token: {} }, actions) {
  switch (actions.type) {

    case types.SET_AUTH:
      return {
        ...state,
        auth: {
          id: actions.id,
          company_id: actions.company_id,
          role: actions.role
        }
      }
    case types.SET_TOKEN:
      return {
        ...state,
        token: {
          access: actions.access,
          refresh: actions.refresh
        }
      }

    default:
      return state
  }
}

import * as types from '../constants';

export function setAuth(auth) {
  return {
  	...auth,
    type: types.SET_AUTH
  }
}

export function setToken(token) {
  return {
    type: types.SET_TOKEN,
    access: token.access,
    refresh: token.refresh
  }
}

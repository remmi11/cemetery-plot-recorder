import * as types from '../constants';

export function setFilter(filter) {
  return {
    filter: filter,
    type: types.SET_FILTER
  }
}

export function setGlobalFilter(filter) {
  return {
    type: types.SET_GLOBAL_FILTER,
    global_filter: filter
  }
}
import * as types from '../constants';

export function setAsset(assets) {
  return {
    assets: assets,
    type: types.SET_ASSET
  }
}
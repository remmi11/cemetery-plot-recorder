import { combineReducers } from 'redux';

import themeReducer from './themeReducers';
import authReducer from './authReducers';

export default combineReducers({
	themeReducer,
	authReducer
});

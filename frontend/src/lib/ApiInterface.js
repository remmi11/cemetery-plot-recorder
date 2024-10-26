import storejs from 'store';
import * as config from '../config.js';

// the compoment to manage the apis.
export default class ApiInterface {
	constructor(apiKey) {
		this.endpoint = config.DEV_IPS[config.env];
		this.token = apiKey;
	}

	// the function to make the GET api call for fetching the data.
	call(apiEndpoint, data, callback) {
		let url = "";
		apiEndpoint = this.endpoint + "/" + apiEndpoint;

		Object.keys(data).map(key => {
			url += key + "=" + data[key] + "&";
		})

		let headers = {}
		if (this.token) {
			headers['Authorization'] = 'Bearer ' + this.token
		}

		fetch(apiEndpoint + "?" + url, {
			method: 'GET',
			headers: headers
		})
		.then(response => {
			if (response.status == 401) {
				storejs.set('token', null)
				window.location.href = '/'
			}
			return response.json();
		})
		.then((response) => callback(response));
	}

	// the function to make the PUT api call for creating new item.
	update(apiEndpoint, data, callback) {
		apiEndpoint = this.endpoint + "/" + apiEndpoint;

		let headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
		if (this.token) {
			headers['Authorization'] = 'Bearer ' + this.token
		}

		fetch(apiEndpoint, {
			method: 'PUT',
			headers: headers,
			body: JSON.stringify(data)
		})
		.then(response => {
			if (response.status == 401) {
				storejs.set('token', null)
				window.location.href = '/'
			}
			return response.json();
		})
		.then((response) => callback(response))
		.catch(err => {
			console.log('caught it!',err);
		})
	}

	// the function to make the POST api call for creating new item.
	create(apiEndpoint, data, callback) {
		apiEndpoint = this.endpoint + "/" + apiEndpoint;
		let headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
		if (this.token) {
			headers['Authorization'] = 'Bearer ' + this.token
		}

		fetch(apiEndpoint, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(data)
		})
		.then(response => {
			if (response.status == 401) {
				storejs.set('token', null)
				window.location.href = '/'
			}
			return response.json();
		})
		.then((response) => callback(response))
		.catch(error => callback(error, true));
	}

	// the function to make the POST api call for uploading a file.
	upload(apiEndpoint, data, callback) {
		apiEndpoint = this.endpoint + "/" + apiEndpoint;

		fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Authorization': 'Bearer ' + this.token,
				'Accept': 'application/json'
			},
			body: data
		})
		.then(response => {
			if (response.status == 401) {
				storejs.set('token', null)
				window.location.href = '/'
			}
			return response.json();
		})
		.then((response) => callback(response))
		.catch(error => callback(error, true));
	}

	// the function to make the POST api call to login the system.
	login(apiEndpoint, data, callback) {
		apiEndpoint = this.endpoint + "/" + apiEndpoint;

		fetch(apiEndpoint, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		})
		.then(response => {
			return response.json();
		})
		.then((response) => callback(response))
		.catch(error => callback(error));
	}

	// the function to get the login user data.
	get_auth(callback) {
		let apiEndpoint = this.endpoint + "/api/auth-user/";

		fetch(apiEndpoint, {
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + this.token
			}
		})
		.then(response => {
			if (response.status == 401) {
				return {}
			}
			return response.json();
		})
		.then((response) => callback(response));
	}

	// the function to make the DELETE api call for removing a item.
	delete(apiEndpoint, callback) {
		apiEndpoint = this.endpoint + "/" + apiEndpoint;
		
		fetch(apiEndpoint, {
			method: 'DELETE',
			headers: {
				'Authorization': 'Bearer ' + this.token,
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		})
		.then(response => {
			if (response.status == 401) {
				storejs.set('token', null)
				window.location.href = '/'
			}
			return response.json();
		})
		.then((response) => callback(response));
	}
}
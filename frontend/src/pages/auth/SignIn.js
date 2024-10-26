import React, { Component } from "react";

import styled from "styled-components";
import { Link } from "react-router-dom";
import storejs from 'store';

import Helmet from 'react-helmet';

import {
  FormControl,
  Button as MuiButton,
  Paper
} from "@material-ui/core";
import { spacing } from "@material-ui/system";
import { Alert as MuiAlert } from '@material-ui/lab';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { connect } from "react-redux";

import ApiInterface from '../../lib/ApiInterface.js'
import { setAuth, setToken } from '../../redux/actions/authActions.js'
import * as config from '../../config.js';

// Local style objects.
const Button = styled(MuiButton)(spacing);

const Wrapper = styled(Paper)`
  padding: ${props => props.theme.spacing(6)}px;

  ${props => props.theme.breakpoints.up("md")} {
    padding: ${props => props.theme.spacing(10)}px;
  }
`;

const LogoTitle = styled.div`
  text-align: center;
  font-size: 38px;
  color: #09539c;
  margin-bottom: 15px;
`;

const Alert = styled(MuiAlert)(spacing);

// The component for signin page.
class SignIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      error: ""
    }
  }

  // The event function to edit username/email and password.
  handleChange(e) {
    let { data } = this.state;

    data[e.target.name] = e.target.value;

    this.setState({data, error: ""});
  }

  // The function to sumbit username and password for signing the page.
  handleSubmit = () => {
    const api = new ApiInterface();
    let { data } = this.state;

    storejs.set('filter', {});
    api.login(`api/token/`, data, (response) => {
      if (response.access) {
        const authApi = new ApiInterface(response.access);
        authApi.get_auth((user) => {
          storejs.set('token', response)
          storejs.set('user', user)
          storejs.set('bounds',[-108.17760745441063,33.234930914675445,-94.99167812063787,36.67397646539162])

          window.location.href = '/assets';
        });
      } else {
        this.setState({error: "Username or password is incorrect."})
      }
    })
  }

  // init funciton
  componentDidMount = () => {
    const token = storejs.get('token', null);
    storejs.set('filter', {});

    console.log(token)
    if (token != null) {
      const authApi = new ApiInterface(token.access);
      authApi.get_auth((user) => {
        window.location.href = '/assets';
      });
    }
  }

  render() {
    let {data} = this.state;
    return (
      <div>
      <LogoTitle>Cemetery Plot Recorder</LogoTitle>
      <Wrapper>
        <Helmet title="Sign In" />

        {this.state.error != "" && <Alert severity="error">{this.state.error}</Alert>}
        <ValidatorForm ref="form" onSubmit={this.handleSubmit} onError={errors => console.log(errors)}>
          <FormControl margin="normal" required fullWidth>
            <TextValidator id="username" name="username" autoComplete="username" autoFocus
              label="Username or Email*" onChange={(e) => this.handleChange(e)}
              value={data.username || ""} validators={['required', ]}
              errorMessages={['This field is required', ]} fullWidth />
          </FormControl>
          <FormControl margin="normal" required fullWidth>
            <TextValidator id="password" type="password" name="password" autoComplete="current-password"
              label="Password*" onChange={(e) => this.handleChange(e)}
              value={data.password || ""} validators={['required', ]}
              errorMessages={['This field is required', ]} fullWidth />
          </FormControl>
          <Button
            type='submit'
            fullWidth
            variant="contained"
            color="primary"
            mb={2}
          >
            Sign in
          </Button>
        </ValidatorForm>
      </Wrapper>
      </div>
    );
  }
}

export default connect(
  (store) => {
    return {
      auth: store
    }
  }, (dispatch) =>{
    return {
      set_auth: (auth) => {
        dispatch(setAuth(auth))
      },
      set_token: (auth) => {
        dispatch(setToken(auth))
      }
    }
  }
)(SignIn);

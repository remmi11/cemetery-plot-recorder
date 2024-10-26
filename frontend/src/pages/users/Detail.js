import React, { Component } from "react";
import styled, { withTheme } from "styled-components";
import PropTypes from 'prop-types';
import storejs from 'store';

import Helmet from 'react-helmet';
import DataTable from 'react-data-table-component';

import {
  Grid,
  TextField,
  TextareaAutosize,
  Select as MuiSelect,
  Typography as MuiTypography,
  Card as MuiCard,
  CardContent as MuiCardContent,
  FormControl as MuiFormControl,
  MenuItem,
  Button as MuiButton,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Checkbox
} from "@material-ui/core";

import {
  ArrowLeft
} from "react-feather";

import {
  RestoreFromTrash,
  Collections,
  AddCircleOutline as AddCircleOutlineIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  FileCopy,
  DirectionsWalk,
  DeleteForever
} from "@material-ui/icons";

import { spacing } from "@material-ui/system";
import { Alert as MuiAlert } from '@material-ui/lab';

import { Link } from "react-router-dom"
import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import ApiInterface from '../../lib/ApiInterface.js';
import * as config from '../../config.js';
import Select from 'react-select';

import {
  PlusCircle,
  Upload
} from "react-feather";

const DSelect = styled(MuiSelect)(spacing);
const Alert = styled(MuiAlert)(spacing);

const Typography = styled(MuiTypography)(spacing);
const Card = styled(MuiCard)(spacing);
const CardContent = styled(MuiCardContent)(spacing);
const Button = styled(MuiButton)(spacing);

// local style objects
const FormControlSpacing = styled(MuiFormControl)(spacing);

const FormControl = styled(FormControlSpacing)`
  min-width: 148px;
`;

const TitleGroup = styled(Grid)`
  display: flex;

  > a {
    padding-top: 2px;
    margin-right: 10px;
  }
`;

const TitleAction = styled(Grid)`
  display: flex;
  justify-content: flex-end;

  svg {
    margin-right: 5px;
  }
`;

const GridContent = styled(Grid)`
  .MuiSelect-select {
    min-width: 136px !important;
  }
`;

const FilterTitle = styled(Grid)`
  padding: 6px;
  background: #292929;
  color: white;
`;

const EditSection = styled(Card)`
  .mapboxgl-map {
    min-height: 300px;
  }
`;

const EditForm = styled(ValidatorForm)`
  padding: 20px 7% !important;

  .css-yk16xz-control {
    border-top: 0px !important;
    border-left: 0px !important;
    border-right: 0px !important;
    border-radius: 0px !important;
  }
  .css-yk16xz-control:hover {
    border-top: 0px !important;
    border-left: 0px !important;
    border-right: 0px !important;
    border-radius: 0px !important;
  }

  #map_no {
    margin-top: 8px;
  }
  .save-tooltip {
    position: absolute;
    top: 128px;
    background: white;
    font-size: 12px;
    box-shadow: 1px 1px 3px 1px #0000007a;
    padding: 10px 0px;
    z-index: 1001;
  }
  .item {
    padding: 5px 10px;
    cursor: pointer;
    display: block;
    background: white;
    border: 0px;
    width: 100%;
    text-align: left;
  }
  .item:hover {
    background: #d0d0d0;
  }

  .auto-panel {
    background-image: linear-gradient(2deg, #e0e0e0, #f1ebeb);
    padding: 10px 0px;
    max-height: 75px;
    overflow-y: auto;
    position: absolute;
    top: 46px;
    width: 100%;
    z-index: 10;
  }
  .auto-item {
    padding: 1px 10px;
  }
  .auto-item:hover {
    background: gray;
    cursor: pointer;
  }
`;

class UserDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user: {},
      saveTooltip: false,
      saveType: 'new',
      validation: {
        username: false,
        confirm: false,
        email: false
      }
    }

    this.wrapperRef = null;
  }

  componentDidMount() {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let params = this.props.match.params;
    const self = this;

    if ((!storejs.get('user').is_superuser || !storejs.get('user').edit_auth)
      && storejs.get('user').id != params.id) {
      window.location.href = '/assets';
    }

    if (params.id != 'new') {
      api.call('api/users/' + params.id + "/", {}, function(res){
        self.setState({user: res});
      })
    }
    document.addEventListener('mouseup', (e) => {
      if (self.wrapperRef && !self.wrapperRef.contains(e.target)) {
        self.setState({select: "",  saveTooltip: false})
      }
    });
  }

  handleChange(e) {
    let { user, validation } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    if (e.target.name == 'edit_auth') {
      user[e.target.name] = e.target.checked ? true : false
    } else {
      user[e.target.name] = e.target.value;
    }

    if ((e.target.name == 'password' || e.target.name == 'confirm') &&
      user.password && user.confirm &&
      user.password != user.confirm) {
      validation.confirm = true;
    } else {
      validation.confirm = false;
    }
    if (e.target.name == 'username') {
      validation.username = false;
    }
    if (e.target.name == 'email') {
      validation.email = false;
    }
    this.setState({user, validation});
  }

  // The function to sumbit the changes of an asset.
  handleSubmit() {
    let { user, saveType, validation } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;

    if (user['edit_auth'] == undefined) {
      user['edit_auth'] = false
    }

    if (validation.username || validation.email || validation.confirm) {
      return
    }

    let payload = JSON.parse(JSON.stringify(user))
    console.log(payload)
    if (this.props.match.params.id != 'new') {
      api.update('api/users/' + user.id.toString() + "/", payload, function(res){
        if (saveType == 'save') {
          window.location.href = '/users/detail/' + user.id.toString();
        } else if (saveType == 'new') {
          window.location.href = '/users/detail/new';
        } else {
          window.location.href = '/users/';
        }
      })
    } else {
      api.create('api/custom-users/', payload, function(res){
        if (res.username && res.username[0] && res.username[0].includes('already exists')) {
          validation.username = true
          self.setState({validation})
          return
        }
        if (res[0] && res[0].includes('Email is')) {
          validation.email = true
          self.setState({validation})
          return
        }
        if (saveType == 'save') {
          window.location.href = '/users/detail/' + res.id.toString();
        } else if (saveType == 'new') {
          window.location.href = '/users/detail/new';
        } else {
          window.location.href = '/users/';
        }
      })
    }
  }

  delete(id) {
    let { filter } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let r = window.confirm("Are you sure you want to remove this user?");

    if (r) {
      api.delete('api/users/' + id + '/', function(remove){
        window.location.href = '/users/';
      })
    }
  }

  render() {
    const {user, saveType,  saveTooltip, select, validation} = this.state;
    const edit_mode = this.props.match.params.id != 'new'
    const edit_auth = user.edit_auth ? true : false

    return (
      <React.Fragment>
        <Helmet title="Users" />

        <EditForm ref="form" onSubmit={(e) => this.handleSubmit(e)} className="edit-form" onError={errors => console.log(errors)}>
          <Typography variant="h3" gutterBottom display="inline">
          <Grid container spacing={6}>
            <TitleGroup item md={3} mb={6}><Link to={`/users`}><ArrowLeft /></Link> {this.props.match.params.id == 'new' ? 'New User' : 'Edit User'}</TitleGroup>
            <Grid item md={5} mb={6}>
            </Grid>
            <TitleAction item md={4} mb={6} xs={12}>
              {storejs.get('user').edit_auth && <Button mr={2} color="primary" variant="outlined" href="/users/detail/new" title="New User">
                <PlusCircle />
              </Button>}
              <Button mr={2} color="primary" variant="outlined" onClick={(e) => this.setState({saveTooltip: !saveTooltip})} title="Save">
                <SaveIcon />
              </Button>
              {saveTooltip && <div className="save-tooltip" ref={(obj) => this.wrapperRef = obj}>
                <button className="item" type="submit" onClick={(e) => this.setState({saveType: 'save'})}>
                  Save
                </button>
                {storejs.get('user').edit_auth && <button div className="item" type="submit" onClick={(e) => this.setState({saveType: 'new'})}>
                  Save and New
                </button>}
                <button className="item" type="submit" onClick={(e) => this.setState({saveType: 'close'})}>
                  Save and Close
                </button>
              </div>}
              {edit_mode && storejs.get('user').edit_auth && <Button mr={2} color="primary" variant="outlined" title="Delete" onClick={(e) => this.delete(this.props.match.params.id)}>
                <DeleteForever />
              </Button>}
            </TitleAction>
          </Grid>
        </Typography>
        <EditSection container spacing={6}>
          <Grid item md={12}>
            <GridContent container>
              <Grid item md={6} xs={12} style={{maxWidth: '46%', flexBasis: '46%', marginRight: '4%', marginTop: '40px'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    Login Info:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator id="username" name="username"
                        value={user.username || ""} label="Username *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e)} fullWidth />
                      {validation.username && <span style={{color: '#f44336'}}>Username is already existed</span>}
                    </FormControl>
                    <FormControl margin="normal" fullWidth>
                      {!edit_mode && <TextValidator type="password" id="password" name="password"
                        value={user.password || ""} label="New Password *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e)} fullWidth />}
                      {edit_mode && <TextValidator type="password" id="password" name="password"
                        value={user.password || ""} label="New Password"
                        onChange={(e) => this.handleChange(e)} fullWidth />}
                    </FormControl>
                    <FormControl margin="normal" fullWidth>
                      {!edit_mode && <TextValidator type="password" id="confirm" name="confirm"
                        value={user.confirm || ""} label="Confirm New Password *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e)} fullWidth />}
                      {edit_mode && <TextValidator type="password" id="confirm" name="confirm"
                        value={user.confirm || ""} label="Confirm New Password"
                        onChange={(e) => this.handleChange(e)} fullWidth />}
                      {validation.confirm && <span style={{color: '#f44336'}}>Password is not matched.</span>}
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item md={6} xs={12} style={{maxWidth: '46%', flexBasis: '46%', marginLeft: '4%', marginTop: '40px'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    User Info:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator id="email" name="email" type="email"
                        value={user.email || ""} label="Email *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e)} fullWidth />
                        {validation.email && <span style={{color: '#f44336'}}>This email already exists.</span>}
                    </FormControl>
                  </Grid>
                  {storejs.get('user').is_superuser && <Grid item md={1} xs={12} style={{'marginTop': '29px'}}>
                    Edit
                  </Grid>}
                  {storejs.get('user').is_superuser && <Grid item md={6} xs={12}>
                    <FormControl margin="normal">
                      <Checkbox type="checkbox" id="edit_auth" name="edit_auth"
                        checked={edit_auth}
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                  </Grid>}
                </Grid>
              </Grid>
            </GridContent>
          </Grid>
        </EditSection>
        </EditForm>
      </React.Fragment>
    );
  }
}

export default withTheme(UserDetail);

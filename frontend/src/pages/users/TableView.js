import React, { Component } from "react";
import styled, { withTheme } from "styled-components";

import storejs from 'store';
import DataTable from 'react-data-table-component';
import { darken } from "polished";

import {
  Grid,
  FormControl,
  FormControlLabel,
  Select as MuiSelect,
  MenuItem,
  InputLabel,
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  InputBase,
  Checkbox
} from "@material-ui/core";
import { Alert as MuiAlert } from '@material-ui/lab';

import {
  Search as SearchIcon,
  Map,
  List as ListIcon,
  DollarSign,
  PlusCircle,
  Upload
} from "react-feather";

import {
  Edit as EditIcon,
  CloudDownload,
  RestoreFromTrash,
  ViewColumn,
  Tune,
  Close
} from "@material-ui/icons";
import { spacing } from "@material-ui/system";

import { connect } from "react-redux";

import ApiInterface from '../../lib/ApiInterface.js';
import { setAsset } from '../../redux/actions/assetActions.js'
import { setFilter, setGlobalFilter } from '../../redux/actions/filterActions.js'
import * as config from '../../config.js';

const Select = styled(MuiSelect)(spacing);
const Button = styled(MuiButton)(spacing);
const Alert = styled(MuiAlert)(spacing);


const Search = styled.div`
  border-radius: 2px;
  background-color: ${props => props.theme.header.background};
  display: none;
  position: relative;
  width: 80%;
  background: #dedede;

  &:hover {
    background-color: ${props => darken(0.05, props.theme.header.background)};
  }

  ${props => props.theme.breakpoints.up("md")} {
    display: block;
  }
`;

const SearchIconWrapper = styled.div`
  width: 50px;
  height: 100%;
  position: absolute;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
  }
`;

const Input = styled(InputBase)`
  color: inherit;
  width: 100%;

  > input {
    color: ${props => props.theme.header.search.color};
    padding-top: ${props => props.theme.spacing(2.5)}px;
    padding-right: ${props => props.theme.spacing(2.5)}px;
    padding-bottom: ${props => props.theme.spacing(2.5)}px;
    padding-left: ${props => props.theme.spacing(12)}px;
    width: 160px;
  }
`;

// Local style objects
const ListView = styled(Grid)`
  margin: 8px;
  font-weight: bold;

  .asset-list {
    max-width: calc(100vw - 115px);
  }

  .label {
    font-size: 16px;
    margin-top: 10px;
  }

  .t-label {
    color: #09539c;
    font-size: 28px;
  }

  .actions {
    svg {
      font-size: 20px;
    }

    > div {
      float: right;
    }
  }

  .rdt_TableHeadRow input {
    border: 1px solid;
    padding: 4px;
    margin-top: 5px;
    font-size: 12px;
  }

  .rdt_TableCol_Sortable {
    div {
      font-weight: bold !important;
      color: black;
      font-size: 13px;
    }
    span {
      opacity: 1;
    }
  }
  .action-icon:hover {
  	color: #0583ff !important;
  }
  .action-icon {
  	color: rgb(9, 83, 156);
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

// The component for asset table view.
class UserTableView extends Component {
  constructor(props) {
    super(props);
    let user = storejs.get('user', {});

    this.state = {
    	data: [],
    	loading: false,
    	page: 1,
    	total: 0,
    	loading: true,
    	filter: "",
    	column: 'id',
    	direction: 'desc'
    }

    this.data = []

    this.columns = [
      {
        name: "#",
        selector: 'number',
        sortable: true
      },
      {
        name: "Username",
        selector: 'username',
        sortable: true
      },
      {
        name: "Email",
        selector: 'email',
        sortable: true
      },
      {
        name: "Create At",
        selector: 'date_joined',
        sortable: true
      },
      {
        name: "Last Login",
        selector: 'last_login',
        sortable: true
      }
    ]
  }

  componentDidMount() {
    let {filter, direction, column} = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    if (!storejs.get('user').edit_auth) {
      window.location.href = '/assets';
    }

    api.call('api/custom-users/', {}, function(res){
    	self.data = res
    	self.updateData(res);
    })
  }

  delete(id) {
    let { filter } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

  	let r = window.confirm("Are you sure you want to remove this user?");

    if (r) {
    	api.delete('api/users/' + id + '/', function(remove){
    		api.call('api/custom-users/', {}, function(res){
		    	self.data = res
		    	self.updateData(res);
		    })
	    })
    }
  }

  updateData(users, filter = null) {
    let temp = []
    filter = filter == null ? this.state.filter : filter

    if (users) {
      temp = users.map((user, index) => {
        user['number'] = index + 1
        user['date_joined'] = new Date(user['date_joined']).toLocaleString()
        user['last_login'] = user['last_login'] ? new Date(user['last_login']).toLocaleString() : ''

        if (user.is_superuser) {
          user['action'] = <div><EditIcon onClick={(e) => this.onRowClick(user.id)} className="action-icon" /></div>
        } else {
          user['action'] = <div><EditIcon onClick={(e) => this.onRowClick(user.id)} className="action-icon" /><Close onClick={(e) => this.delete(user.id)} className="action-icon" /></div>
        }
        return user;
      })
    }
    if (filter && filter != "") {
      temp = temp.filter(user => user['username'].toLowerCase().includes(filter.toLowerCase()) || user['email'].toLowerCase().includes(filter.toLowerCase()))
    }

    this.setState({data: temp, loading: false});
  }

  onRowClick(e) {
    if (storejs.get('user').is_superuser) {
      window.location.href = '/users/detail/' + e.id;
    }
  }

  onFilter(e) {
  	let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let {filter, direction, column} = this.state;
    const self = this;
    // api.call('api/custom-users/', {}, function(res){
    // 	self.data = res
    // 	self.updateData(res);
    // })
    self.updateData(self.data, e.target.value);
    this.setState({filter: e.target.value})
  }

  render () {
  	const {data, loading, direction} = this.state; 

    let timestamp = new Date().getTime();
    let tableWidth = (window.innerWidth - 100).toString() + 'px';
    if (window.innerWidth > 860) {
      tableWidth = "100%";
    }
    let defaultDirection = direction == 'asc' ? true : false;
    return (
      <ListView container spacing={6}>
        <Grid item md={6} mb={6} className="label">
          <span className="t-label">Users</span>
        </Grid >
        <Grid item md={6} mb={6} className="actions">
          <Grid item md={12} mb={6} style={{minWidth: '400px'}}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <Input placeholder="Search" onChange={(e) => this.onFilter(e)} />
            </Search>
          </Grid>
          <div style={{marginRight: '25px'}}>
            <Button mr={2} title="New User" color="primary" href="/users/detail/new" variant="outlined">
              <PlusCircle />
            </Button>
          </div>
        </Grid>

        <Grid item md={12} mb={6} className="asset-list">
          <DataTable
            key={timestamp}
            columns={this.columns}
            data={data}
            noHeader={true}
            style={{width: tableWidth}}
            progressPending={this.state.loading}
            progressPending={loading}
            pagination
            persistTableHead
            paginationPerPage={20}
            paginationRowsPerPageOptions={[20,]}
            onRowClicked={(e) => this.onRowClick(e)}
            highlightOnHover={true}
            pointerOnHover={true} />
        </Grid>
      </ListView>
    )
  }
}

export default withTheme(UserTableView);
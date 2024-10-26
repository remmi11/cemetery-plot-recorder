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
  Switch,
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
  Close as CloseIcon
} from "@material-ui/icons";
import { spacing } from "@material-ui/system";

import { connect } from "react-redux";

import ApiInterface from '../../lib/ApiInterface.js';
import { setAsset } from '../../redux/actions/assetActions.js'
import { setFilter, setGlobalFilter } from '../../redux/actions/filterActions.js'
import AssetDetail from '../assets/AssetDetail.js';
import TicketDetail from './Detail.js';
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

  .account-label {
    color: #09539c;
    font-size: 20px;
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

  .filter {
    input {
      width: 90%;
    }
  }

  #row-0 {
    position: sticky;
    top: 40px;
    z-index: 10;
  }
  .rdt_TableHead {
    position: sticky;
    top: 0px;
    z-index: 10;
  }

  .filter-icon {
    border: 1px solid #09539c;
    padding: 4px 8px;
    color: #09539c;
    margin-right: 10px;
    font-weight: 400;

    svg {
      margin: -1px -4px -4px 2px;
      font-size: 16px;
      cursor: pointer;
    }
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
class TicketTableView extends Component {
  constructor(props) {
    super(props);
    let user = storejs.get('user', {});

    this.state = {
    	data: [],
    	page: 1,
    	total: 0,
      filtered_count: 0,
    	filter: "",
    	column: 'lastUpdated',
    	direction: 'desc',
      selectedAsset: null,
      assetDetail: false,
      loader: false,
      filterBubbles: {},
      showClosed: true,
      ticketDetail: false,
      selectedTicket: null
    }

    this.data = []
    this.itemLoad = false;

    this.columns = [
      {
        name: "No",
        selector: 'id',
        compact: true,
        width: '40px',
        grow: 0.1,
        sortable: true
      },
      {
        name: "Project Number",
        selector: 'projectNo',
        compact: true,
        minWidth: '120px',
        grow: 0.1,
        sortable: true
      },
      {
        name: "Subject",
        selector: 'subject',
        minWidth: '90px',
        grow: 0.1,
        compact: true,
        sortable: true
      },
      {
        name: "Type",
        selector: 'surveyType',
        compact: true,
        minWidth: '80px',
        grow: 0.1,
        sortable: true
      },
      {
        name: "Address",
        selector: 'address',
        width: '180px',
        grow: 0.4,
        compact: true,
        sortable: true
      },
      {
        name: "Account Number",
        selector: 'accountNo',
        minWidth: '120px',
        grow: 0.1,
        compact: true,
        sortable: true
      },
      {
        name: "Response",
        selector: 'response',
        minWidth: '60px',
        grow: 0.2,
        compact: true,
        sortable: true
      },
      {
        name: "Status",
        selector: 'status',
        compact: true,
        minWidth: '70px',
        grow: 0.1,
        sortable: true
      },
      {
        name: "Author",
        selector: 'user',
        compact: true,
        minWidth: '70px',
        grow: 0.1,
        sortable: true
      },
      {
        name: "Last Edited",
        selector: 'edit_user',
        compact: true,
        width: '80px',
        sortable: true
      },
      {
        name: "Last Updated",
        selector: 'lastUpdated',
        width: '110px',
        compact: true,
        sortable: true
      },
      {
        name: "Notes",
        selector: 'notes',
        compact: true,
        sortable: true
      },
    ]

    this.subFilter = {};
  }

  componentDidMount() {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let filterBubbles = {};
    let {filter, direction, column, page} = this.state;
    const self = this;
    let params = {filter: filter, direction: direction, column: column, page: 1}

    api.call('api/ticket_total_count/', {}, function(res){
      self.setState({total: res.count})
    })

    this.subFilter = storejs.get('ticketFilter', {});
    const showClosed = storejs.set('showClosed', true);

    Object.keys(this.subFilter).forEach(key => {
      if (!Object.keys(filterBubbles).includes[key] && this.subFilter[key]) {
        filterBubbles[key] = this.subFilter[key]
        params[key] = this.subFilter[key]
      }
    })

    if (showClosed == false) {
      params['status'] = 'open'
    }

    api.call('api/ticket_create/', params, function(res){
      self.data = res
      self.updateData(res);
    })
    params['count'] = true;
    api.call('api/ticket_count/', params, function(res){
      self.setState({filtered_count: res.count});
    })

    const query = new URLSearchParams(this.props.location.search);
    const projectno = query.get('project');

    if (projectno) {
      this.setState({selectedTicket: projectno, ticketDetail: true,
        loader: true, page: 1, filterBubbles, showClosed})
    } else {
      this.setState({loader: true, page: 1, filterBubbles, showClosed})
    }
  }

  delete(id) {
    let { filter } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

  	let r = window.confirm("Are you sure you want to remove this ticket?");

    if (r) {
    	api.delete('api/ticket/' + id + '/', function(remove){
    		api.call('api/ticket_create/', {filter: filter}, function(res){
		    	self.data = res
		    	self.updateData(res);
		    })
	    })
    }
  }

  updateData(tickets) {
    let temp = []

    let timestamp = new Date().getTime();

    let search = {
      projectNo: <div className="filter" key={timestamp}><input name="projectNo" className="projectNo" placeholder="Project No" defaultValue={this.subFilter.collection} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      subject: <div className="filter" key={timestamp}><input name="subject" className="subject" placeholder="Subject" defaultValue={this.subFilter.subject} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      surveyType: <div className="filter" key={timestamp}><input name="surveyType" className="surveyType" placeholder="Survey Type" defaultValue={this.subFilter.surveyType} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      address: <div className="filter" key={timestamp}><input name="address" className="address" placeholder="Address" defaultValue={this.subFilter.address} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      accountNo: <div className="filter" key={timestamp}><input name="accountNo" className="accountNo" placeholder="Account Number" defaultValue={this.subFilter.accountNo} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      response: <div className="filter" key={timestamp}><input name="response" className="response" placeholder="Response" defaultValue={this.subFilter.response} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      status: <div className="filter" key={timestamp}><input name="status" className="status" placeholder="Status" defaultValue={this.subFilter.status} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      edit_user: <div className="filter" key={timestamp}><input name="edit_user" className="edit_user" placeholder="Last edited" defaultValue={this.subFilter.edit_user} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      notes: <div className="filter" key={timestamp}><input name="notes" className="notes" placeholder="Notes" defaultValue={this.subFilter.notes} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      user: <div className="filter" key={timestamp}><input name="author" className="author" placeholder="Author" defaultValue={this.subFilter.author} onKeyUp={(e) => this.onSubFilter(e)} /></div>
    }

    temp = [];
    if (tickets) {
      temp.push(search);
      tickets.forEach(ticket => {
        ticket['lastUpdated'] = new Date(ticket['lastUpdated']).toLocaleString()
        ticket['projectNo'] = <a onClick={() => this.onProjectNumber(ticket['assetid'])} href="#">{ticket['projectNo']}</a>
        temp.push(ticket)
      })
    }

    this.setState({data: temp, loader: false});
    this.itemLoad = false;
  }

  onProjectNumber(aid) {
    this.setState({selectedAsset: aid, assetDetail: true})
  }

  onRowClick(e) {
    this.setState({ticketDetail: true, selectedTicket: e.id.toString()})
    // window.location.href = '/tickets/detail/' + e.id;
  }

  onFilter(e) {
  	let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let {filter, direction, column} = this.state;
    const self = this;
    api.call('api/ticket_create/', {filter: e.target.value, direction: direction, column: column}, function(res){
    	self.data = res
    	self.updateData(res);
    })
    this.setState({filter: e.target.value})
  }

  onSort(column, direction) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let {filter, sort, showClosed} = this.state;
    const self = this;
    console.log([direction, column])

    let params = {filter: filter, direction: direction, column: column.selector}
    Object.keys(this.subFilter).forEach(key => {
      if (this.subFilter[key]) {
        params[key] = this.subFilter[key]
      }
    })

    if (showClosed == false) {
      params['status'] = 'open'
    }

    api.call('api/ticket_create/', params, function(res){
    	self.data = res
    	self.updateData(res);
    })
    params['count'] = true;
    api.call('api/ticket_count/', params, function(res){
      self.setState({filtered_count: res.count});
    })

    this.setState({column: column.selector, direction: direction})
  }

  onSubFilter(e) {
    console.log(e.key)
    if (e.key === 'Enter') {
      let filterBubbles = {};
      let {filter, direction, column, page, showClosed} = this.state;
      const self = this;
      let params = {filter: filter, direction: direction, column: column, page: 1}
      let token = storejs.get('token', null)
      let api = new ApiInterface(token.access);

      Object.keys(this.subFilter).forEach(key => {
        if (!Object.keys(filterBubbles).includes[key] && this.subFilter[key]) {
          filterBubbles[key] = this.subFilter[key]
          params[key] = this.subFilter[key]
        }
      })

      if (showClosed == false) {
        params['status'] = 'open'
      }

      api.call('api/ticket_create/', params, function(res){
        self.data = res
        self.updateData(res);
      })
      params['count'] = true;
      api.call('api/ticket_count/', params, function(res){
        self.setState({filtered_count: res.count});
      })

      this.itemLoad = true
      this.setState({loader: true, page: 1, filterBubbles})
      storejs.set('ticketFilter', this.subFilter);
    } else {
      this.subFilter[e.target.name] = e.target.value;
    }
  }

  removeFilter(rKey) {
    let filterBubbles = {};
    let {filter, direction, column, page, showClosed} = this.state;
    const self = this;
    let params = {filter: filter, direction: direction, column: column, page: 1}
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let subFilter = {}

    Object.keys(this.subFilter).forEach(key => {
      if (key != rKey) {
        subFilter[key] = this.subFilter[key];
      }
    })
    this.subFilter = subFilter;

    Object.keys(this.subFilter).forEach(key => {
      if (!Object.keys(filterBubbles).includes[key] && this.subFilter[key]) {
        filterBubbles[key] = this.subFilter[key]
        params[key] = this.subFilter[key]
      }
    })

    if (showClosed == false) {
      params['status'] = 'open'
    }

    api.call('api/ticket_create/', params, function(res){
      self.data = res
      self.updateData(res);
    })
    params['count'] = true;
    api.call('api/ticket_count/', params, function(res){
      self.setState({filtered_count: res.count});
    })

    this.itemLoad = true
    this.setState({loader: true, page: 1, filterBubbles})
    storejs.set('ticketFilter', this.subFilter);
  }

  closeAndNew = () => {
    const self = this;
    this.setState({selectedAsset: 'new', assetDetail: false});

    setTimeout(() => {
      self.setState({assetDetail: true});
    }, 1000)
  }

  closeAndNewTicket = () => {
    const self = this;
    this.setState({ticketDetail: false});

    setTimeout(() => {
      self.setState({ticketDetail: true, selectedTicket: 'new'});
    }, 1000)
  }

  handleScroll = (e) => {
    const bottom = parseInt(e.target.scrollHeight - e.target.scrollTop);
    const delta = 1

    if (Math.abs(bottom - e.target.clientHeight) <= delta && this.itemLoad == false) {
      let token = storejs.get('token', null)
      let api = new ApiInterface(token.access);

      console.log('yes!')

      let {filter, direction, column, page, filterBubbles, showClosed} = this.state;
      const self = this;
      page += 1
      let params = {filter: filter, direction: direction, column: column, page: page}

      Object.keys(filterBubbles).forEach(key => {
        if (!Object.keys(params).includes[key] && filterBubbles[key]) {
          params[key] = filterBubbles[key]
        }
      })

      if (showClosed == false) {
        params['status'] = 'open'
      }

      api.call('api/ticket_create/', params, function(res){
        self.data = self.data.concat(res)
        self.updateData(self.data);
      })
      params['count'] = true;
      api.call('api/ticket_count/', params, function(res){
        self.setState({filtered_count: res.count});
      })
      this.itemLoad = true
      this.setState({loader: true, page: page})
    }
  }

  onShowClosed = (e) => {
    let {showClosed, filter, direction, column, page, filterBubbles} = this.state
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    let params = {filter: filter, direction: direction, column: column, page: 1}


    showClosed = !showClosed
    storejs.set('showClosed', showClosed);

    Object.keys(filterBubbles).forEach(key => {
      if (!Object.keys(params).includes[key] && filterBubbles[key]) {
        params[key] = filterBubbles[key]
      }
    })

    if (showClosed == false) {
      params['status'] = 'open'
    }

    api.call('api/ticket_create/', params, function(res){
      self.data = res
      self.updateData(self.data);
    })
    params['count'] = true;
    api.call('api/ticket_count/', params, function(res){
      self.setState({filtered_count: res.count});
    })
    this.itemLoad = true
    this.setState({showClosed, loader: true, page: 1, filterBubbles})
  }

  onReload = () => {
    let {filter, direction, column, showClosed, filterBubbles} = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let params = {filter: filter, direction: direction, column: column, page: 1}

    Object.keys(filterBubbles).forEach(key => {
        if (!Object.keys(params).includes[key] && filterBubbles[key]) {
        params[key] = filterBubbles[key]
      }
    })

    if (showClosed == false) {
      params['status'] = 'open'
    }

    api.call('api/ticket_create/', params, function(res){
      self.data = res
      self.updateData(res);
    })
    params['count'] = true;
    api.call('api/ticket_count/', params, function(res){
      self.setState({filtered_count: res.count});
    })
    api.call('api/ticket_total_count/', {}, function(res){
      self.setState({total: res.count})
    })
  }

  render () {
  	const {data, direction, showClosed} = this.state; 

    let timestamp = new Date().getTime();
    let tableWidth = (window.innerWidth - 100).toString() + 'px';
    if (window.innerWidth > 860) {
      tableWidth = "100%";
    }
    let defaultDirection = direction == 'asc' ? true : false;
    return (
      <ListView container spacing={6}>
        <Grid item md={6} mb={6} className="label">
          <span className="t-label">Tickets</span>
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
            <Button mr={2} title="New Ticket" color="primary"
              onClick={()=>{this.setState({ticketDetail: true, selectedTicket: 'new'})}} variant="outlined">
              <PlusCircle />
            </Button>
          </div>
          <div style={{marginRight: '25px'}}>
            <FormControlLabel
              style={{marginLeft: '10px'}}
              control={
                <Switch
                  checked={showClosed}
                  onChange={(e) => this.onShowClosed(e)}
                  value="mapped"
                />
              }
              label="Show Closed"
            />
          </div>
        </Grid>
        <Grid item md={12} mb={6} className="label">
          <span className="account-label pavements active">Ticket Count: {this.state.filtered_count} Results</span>
        </Grid>

        <Grid item md={12} mb={6} className="asset-list">
          {Object.keys(this.state.filterBubbles).map(ft => {
            return <span className="filter-icon"><b>{ft}</b>: {this.state.filterBubbles[ft]} <CloseIcon onClick={()=>this.removeFilter(ft)}/></span>
          })}
        </Grid>

        <Grid item md={12} mb={6} className="asset-list" style={{padding: '0px'}}>
          {this.state.loader && <img src="/static/img/load.gif" style={{width: '70px', position: 'absolute', zIndex: '1', left: '47%', top: '50%'}} />}
        </Grid>
        <Grid item md={12} mb={6} className="asset-list" onScroll={(e) => this.handleScroll(e)} id="table-scroll">
          <DataTable
            columns={this.columns}
            data={data}
            noHeader={true}
            style={{width: tableWidth, overflowX: 'hidden', height: 'calc(100vh - 235px)', overflowY: 'auto'}}
            persistTableHead
            onRowClicked={(e) => this.onRowClick(e)}
            highlightOnHover={true}
            pointerOnHover={true}
            onSort={(column, direction, e) => this.onSort(column, direction, e)}
            sortServer={true}
            defaultSortField={this.state.column}
            defaultSortAsc={defaultDirection} />
        </Grid>

        <Dialog
          open={this.state.assetDetail}
          onClose={(e)=>this.setState({assetDetail: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="xl"
          fullWidth={true}
        >
          <DialogContent>
            <AssetDetail assetId={this.state.selectedAsset}
              onReload={()=> {}}
              closeAssetDetail={() => {this.setState({assetDetail: false})}}
              setSelectedAsset={(id) => {this.setState({selectedAsset: id})}}
              closeAndNew={() => {this.closeAndNew()}} />
          </DialogContent>
        </Dialog>

        <Dialog
          open={this.state.ticketDetail}
          onClose={(e)=>this.setState({ticketDetail: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="xl"
          fullWidth={true}
        >
          <DialogContent>
            <TicketDetail ticketId={this.state.selectedTicket}
              onReload={()=>this.onReload()}
              closeTicketDetail={()=>this.setState({ticketDetail: false, selectedTicket: null})}
              setTicket={(id) => {this.setState({selectedTicket: id})}}
              closeAndNewTicket={() => this.closeAndNewTicket()} />
          </DialogContent>
        </Dialog>
      </ListView>
    )
  }
}

export default withTheme(TicketTableView);
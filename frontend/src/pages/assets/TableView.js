import React, { Component } from "react";
import styled, { withTheme } from "styled-components";

import storejs from 'store';
import DataTable from 'react-data-table-component';

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
  Switch,
  Checkbox
} from "@material-ui/core";
import { Alert as MuiAlert } from '@material-ui/lab';

import {
  Edit as EditIcon,
  CloudDownload,
  RestoreFromTrash,
  ViewColumn,
  Tune,
  NotificationImportant,
  Close as CloseIcon
} from "@material-ui/icons";
import { spacing } from "@material-ui/system";

import { connect } from "react-redux";

import ApiInterface from '../../lib/ApiInterface.js';
import { setAsset } from '../../redux/actions/assetActions.js'
import { setFilter, setGlobalFilter } from '../../redux/actions/filterActions.js'
import * as config from '../../config.js';
import AssetDetail from './AssetDetail'

const Select = styled(MuiSelect)(spacing);
const Button = styled(MuiButton)(spacing);
const Alert = styled(MuiAlert)(spacing);

// Local style objects
const ListView = styled(Grid)`
  margin: 8px;
  font-weight: bold;

  .asset-list {
    max-width: calc(100vw - 115px);
  }

  #table-scroll > div {
    overflow-y: auto;
    max-height: calc(100vh - 335px);
  }

  .label {
    font-size: 16px;
    margin-top: 10px;
  }

  .t-label {
    color: #09539c;
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

  .filter {
    input {
      width: 75%;
    }
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

  #row-0 {
    position: sticky;
    top: 30px;
    z-index: 10;
  }
  .rdt_TableHead {
    position: sticky;
    top: 0px;
    z-index: 10;
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

const FilterIcon = styled.div`
  position: absolute;
  top: -12px;
  right: -12px;
  .MuiSvgIcon-root {
    color: red;
  }
`

const GeomIcon = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: black;
  &.residential {
    background: #27409a;
  }
  &.rural {
    background: #c70f0f;
  }
  &.plss {
    background: #d8951c;
  }
  &.route {
    background: green;
  }
`

// The component for asset table view.
class AssetATableView extends Component {
  constructor(props) {
    super(props);
    let user = storejs.get('user', {});

    this.filters = {}

    // Define the columns for filtering.
    this.columnFilters = {
      pk: {
        label: 'ID',
        checked: true
      },
      first_name: {
        label: 'First Name',
        checked: true
      },
      last_name: {
        label: 'Last Name',
        checked: true
      },
      middle_name: {
        label: 'Middle Name',
        checked: true
      },
      suffix: {
        label: 'Suffix',
        checked: true
      },
      maiden: {
        label: 'Maiden Name',
        checked: true
      },
      is_veteran: {
        label: 'Veteran?',
        checked: true
      },
      county: {
        label: 'County',
        checked: true
      },
      addition: {
        label: 'Addition',
        checked: true
      },
      unit: {
        label: 'Unit',
        checked: true
      },
      block: {
        label: 'Block',
        checked: true
      },
      lot: {
        label: "Lot",
        checked: true
      },
      plot: {
        label: "Plot",
        checked: true
      },
    }

    // Define the columns in asset table.
    this.columns = [
      {
        name: "ID",
        selector: 'pk',
        compact: true,
        width: '50px',
        sortable: true
      },
      {
        name: "First Name",
        selector: 'first_name',
        compact: true,
        width: '150px',
        sortable: true
      },
      {
        name: "Last Name",
        selector: 'last_name',
        compact: true,
        width: '150px',
        sortable: true
      },
      {
        name: "Suffix",
        selector: 'suffix',
        compact: true,
        width: '100px',
        sortable: true
      },
      {
        name: "Maiden Name",
        selector: 'maiden_name',
        compact: true,
        width: '120px',
        sortable: true
      },
      {
        name: "Veteran",
        selector: 'is_veteran',
        compact: true,
        width: '100px',
        sortable: true
      },
      {
        name: "County",
        selector: 'county',
        compact: true,
        width: '130px',
        sortable: true
      },
      {
        name: "Addition",
        selector: 'addition',
        compact: true,
        width: '130px',
        sortable: true
      },
      {
        name: "Unit",
        selector: 'unit',
        compact: true,
        width: '130px',
        sortable: true
      },
      {
        name: "Block",
        selector: 'block',
        compact: true,
        width: '130px',
        sortable: true
      },
      {
        name: "Lot",
        selector: 'lot',
        compact: true,
        width: '130px',
        sortable: true
      },
      {
        name: "Plot",
        selector: 'plot',
        width: '130px',
        compact: true,
        sortable: true
      },
    ]

    // console.log(this.props.mapped)

    this.state = {
      data: [],
      notification: false,
      notification_text: "",
      notification_type: "success",
      loading: false,
      total: 0,
      totalRows: 0,
      perPage: 20,
      columnDialog: false,
      filterDialog: false,
      columnFilters: JSON.parse(JSON.stringify(this.columnFilters)),
      filter: {},

      mapped: this.props.mapped,

      level1: [],
      level2: [],
      level3: [],
      level4: [],
      counties: [],

      filterIcon: false,

      sort: {},

      loader: false,

      page: 1,

      filterBubbles: {},

      assetDetail: false,
      selectedAsset: null
    }

    this.itemLoad = false;

    this.subFilter = {}
  }

  componentDidMount() {
    let { lAssets, filter, total } = this.props;
    const self = this;

    this.subFilter = {}
    const keys = this.columns.map(column => column.selector)
    Object.keys(filter).forEach(key => {
      if (keys.includes(key)) {
        this.subFilter[key] = filter[key]
      }
    })

    this.updateData(lAssets);

    let isFilered = false;
    let filterBubbles = {}
    Object.keys(filter).map(key => {
      if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng', 'gf'].includes(key) && filter[key] != '') {
        isFilered = true;

        filterBubbles[key] = filter[key]
      }
    })

    this.setState({filter, filterIcon: isFilered, filterBubbles});
    storejs.set('assetPrePage', 'table');
  }

  componentDidUpdate(nextProps) {
    let { lAssets, filter, bbox, globalFilter } = this.props;

    this.subFilter = {}
    const keys = this.columns.map(column => column.selector)
    Object.keys(filter).forEach(key => {
      if (keys.includes(key)) {
        this.subFilter[key] = filter[key]
      }
    })

    if (nextProps.lAssets != lAssets) {
      // console.log('assets')
      this.updateData(lAssets);
    }
    if (nextProps.filter != filter) {
      // console.log('filter')
      this.setState({filter});
    }
    if (nextProps.globalFilter != globalFilter) {
      this.setState({loader: true});
    }
    if (nextProps.bbox != bbox && bbox) {
      // console.log(bbox)
      storejs.set('bounds', bbox)
    }
  }

  // The function to update the data in asset table.
  updateData(assets, loader) {
    let temp = []
    let { page } = this.state

    let search = {
      first_name: <div className="filter"><input name="first_name" className="first_name" placeholder="First Name" defaultValue={this.subFilter.first_name} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      last_name: <div className="filter"><input name="last_name" className="last_name" placeholder="Last Name" defaultValue={this.subFilter.last_name} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      middle_name: <div className="filter"><input name="middle_name" className="middle_name" placeholder="Middle Name" defaultValue={this.subFilter.middle_name} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      suffix: <div className="filter"><input name="suffix" className="suffix" placeholder="Suffix" defaultValue={this.subFilter.suffix} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      maiden_name: <div className="filter"><input name="maiden_name" className="maiden_name" placeholder="Maiden Name" defaultValue={this.subFilter.maiden_name} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      county: <div className="filter"><input name="county" className="county" placeholder="County" defaultValue={this.subFilter.county} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      addition: <div className="filter"><input name="addition" className="addition" placeholder="Addition" defaultValue={this.subFilter.addition} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      unit: <div className="filter"><input name="unit" className="unit" placeholder="Unit" defaultValue={this.subFilter.unit} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      block: <div className="filter"><input name="block" className="block" placeholder="Block" defaultValue={this.subFilter.block} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      lot: <div className="filter"><input name="lot" className="lot" placeholder="Lot" defaultValue={this.subFilter.lot} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
      plot: <div className="filter"><input name="plot" className="plot" placeholder="Plot" defaultValue={this.subFilter.plot} onKeyUp={(e) => this.onSubFilter(e)} /></div>,
    }

    temp.push(search);

    if (assets && assets.features) {
      assets.features.forEach(asset => {
        let properties = asset.properties;

        if (asset.geometry) {
          properties.geom = <GeomIcon className={`${properties.join_type}`}></GeomIcon>
        }
        if (properties.cemetery_plot_form) {
          properties.first_name = properties.cemetery_plot_form.first_name;
          properties.middle_name = properties.cemetery_plot_form.middle_name;
          properties.last_name = properties.cemetery_plot_form.last_name;
          properties.suffix = properties.cemetery_plot_form.suffix;
          properties.maiden_name = properties.cemetery_plot_form.maiden_name;
          if (properties.cemetery_plot_form.is_veteran) 
            properties.is_veteran = 'Yes';
          else
            properties.is_veteran = 'No';
        }

        temp.push(properties);
      })
    }

    if (loader) {
      this.setState({data: temp, total: temp.length, loader: true});
    } else {
      this.setState({data: temp, total: temp.length, loader: false});
    }
    
    this.itemLoad = false;
  }

  // The event funciton to open 'custom columns' or 'advanced filters' dialogs. 
  handleOpen(e, type) {
    // console.log(type)
    if (type == 'columnDialog') {
      this.setState({columnDialog: true})
    } else {
      this.setState({filterDialog: true})
    }
  }

  // The event funciton to apply the changes and close the diolag for 'custom columns' or 'advanced filters'.
  handleClose(e, type, filter) {
    if (type == 'columnDialog') {
      this.columnFilters = JSON.parse(JSON.stringify(this.state.columnFilters))
      this.setState({columnDialog: false})
    } else {
      filter = filter ? filter : this.state.filter;
      let {globalFilter} = this.props;
      let {sort} = this.state;
      let isFilered = false;
      let filterBubbles = {};

      Object.keys(filter).map(key => {
        if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng'].includes(key) && filter[key] != '') {
          isFilered = true;

          filterBubbles[key] = filter[key]
        }
      })

      // assets.features = temp;
      this.setState({filterDialog: false, filterIcon: isFilered, loader: true, filterBubbles});
      this.props.onUpdateFilter(filter);

      filter['mapped'] = this.state.mapped
      this.props.getDataFromServer(filter, globalFilter, 1, sort)
      this.setState({page: 1})
    }
  }

  onSubFilter(e) {
    if (e.key === 'Enter') {
      // console.log('submit ---')
      let {globalFilter, lAssets} = this.props;
      let {sort, filter} = this.state;
      let isFilered = false;
      let filterBubbles = {};

      Object.keys(filter).map(key => {
        if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng'].includes(key) && filter[key] != '') {
          isFilered = true;
          filterBubbles[key] = filter[key]
        }
      })

      Object.keys(this.subFilter).forEach(key => {
        filter[key] = this.subFilter[key]
        if (!Object.keys(filterBubbles).includes[key]) {
          filterBubbles[key] = filter[key]
        }
      })

      this.props.onUpdateFilter(filter);
      this.updateData(lAssets, true)

      filter['mapped'] = this.state.mapped
      this.props.getDataFromServer(filter, globalFilter, 1, sort)
      this.setState({page: 1, filterBubbles})
    } else {
      this.subFilter[e.target.name] = e.target.value;
    }
  }

  removeFilter(rKey) {
    let {globalFilter, lAssets} = this.props;
    let {sort, filter} = this.state;
    let isFilered = false;
    let filterBubbles = {};
    let uFilter = {}

    Object.keys(filter).forEach(key => {
      if (key != rKey) {
        uFilter[key] = filter[key];
      }
    })

    Object.keys(uFilter).map(key => {
      if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng'].includes(key) && uFilter[key] != '') {
        isFilered = true;
        filterBubbles[key] = uFilter[key]
      }
    })

    this.props.onUpdateFilter(uFilter);
    this.updateData(lAssets, true)

    uFilter['mapped'] = this.state.mapped
    this.props.getDataFromServer(uFilter, globalFilter, 1, sort)
    this.setState({page: 1, filterBubbles, filter: uFilter})
  }

  // The event function when checking the checkboxes on 'custom filter' dialog.
  onColumnFilters(e) {
    let {columnFilters} = this.state;
    var num = 0;
    Object.keys(columnFilters).map(c => {
      if(columnFilters[c].checked) {
        num += 1;
      }
    })
    columnFilters[e.target.name].checked = e.target.checked;
    this.setState({columnFilters})
  }

  // The event function to go to the asset detail page, when selecting row in the asset table.
  onRowClick(e) {
    // window.location.href = '/assets/detail/' + e.pk;
    // console.log("Row clicked...", e, e.pk);
    this.setState({assetDetail: true, selectedAsset: e.pk});
  }

  // The event function to clear the filters on 'custom filter'
  clearFilter(e) {
    this.setState({filter: {}, filterIcon: false});
    this.handleClose(e, 'filterColumn', {});
  }

  handleNotificationClose() {
    this.setState({notification: false})
  }

  // The event function to edit the fields in 'advanced filter' dialog.
  handleFilters(e, type) {
    let { filter } = this.state;

    if (['join_type', 'county', 'level1', 'level2', 'level3'].includes(type)) {
      this.loadLegal(type, e)
    } else {
      filter[e.target.name] = e.target.value;
      this.setState({filter})
    }
  }

  // Download shape and csv files with the filtered assets.
  downloadFile() {
    let {filter, globalFilter} = this.props;
    let token = storejs.get('token', null)

    if (storejs.get('bounds', null)) {
      filter['bound'] = storejs.get('bounds', null).join(',')
    }
    if (filter['mapped'] == undefined) {
      filter['mapped'] = this.state.mapped
    }

    var filters = Object.keys(filter).map(function(key) {
      return key + '=' + filter[key];
    }).join('&');

    let href = config.DEV_IPS[config.env] + '/api/download/?global=' + globalFilter + "&" + filters;
    const link = document.createElement('a');
    var att = document.createAttribute("target");
    att.value = '_blank';
    link.setAttributeNode(att); 
    document.body.appendChild(link);

    let headers = new Headers();
    headers.append('Authorization', 'Bearer ' + token.access);

    fetch(href, { headers })
        .then(response => response.blob())
        .then(blobby => {
            let objectUrl = window.URL.createObjectURL(blobby);

            link.href = objectUrl;
            link.download = 'plots.csv';
            link.click();

            window.URL.revokeObjectURL(objectUrl);
        });
  }

  handlePageChange(page) {
    let {filter, globalFilter} = this.props;
    let {sort} = this.state;

    filter['mapped'] = this.state.mapped
    this.setState({loader: true});
    this.props.getDataFromServer(filter, globalFilter, page, sort);
  }

  onSort(column, direction) {
    let {filter, globalFilter} = this.props;
    let sort = {column: column.selector, direction: direction};
    filter['mapped'] = this.state.mapped
    this.props.getDataFromServer(filter, globalFilter, 1, sort);
    this.setState({sort, loader: true, page: 1})
  }

  getCounty(join_type) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    api.call('api/ajax_load_counties/', {join_type: join_type}, function(res){
      self.setState({counties: res})
    })
  }

  onReload() {
    // console.log("on reload....")
    
    this.setState({assetDetail: false})

    let {filter, globalFilter} = this.props;
    let {sort} = this.state;

    this.props.getDataFromServer(filter, globalFilter, 1, sort);
  }

  onShowMapped(e) {
    let {filter, globalFilter} = this.props;
    let {sort} = this.state;

    filter['mapped'] = e.target.checked
    this.props.getDataFromServer(filter, globalFilter, 1, sort);
    this.props.onMapped(e.target.checked)
    this.setState({mapped: e.target.checked, loader: true, page: 1})
  }

  handleScroll = (e) => {
    const bottom = parseInt(e.target.scrollHeight - e.target.scrollTop);
    const delta = 1

    if (Math.abs(bottom - e.target.clientHeight) <= delta && this.itemLoad == false) {
      let token = storejs.get('token', null)
      let api = new ApiInterface(token.access);

      // console.log('yes!')

      let {filter, globalFilter} = this.props;
      let {sort, page} = this.state;

      filter['mapped'] = this.state.mapped
      page += 1
      this.props.getDataFromServer(filter, globalFilter, page, sort);
      this.itemLoad = true
      this.setState({loader: true, page: page})
    }
  }

  closeAndNew = () => {
    const self = this;
    this.setState({selectedAsset: 'new', assetDetail: false});

    setTimeout(() => {
      self.setState({assetDetail: true});
    }, 1000)
  }

  render () {
    const {loading, data, totalRows, columnFilters, filter, mapped, filterIcon} = this.state;  
    const availableColumns = Object.keys(columnFilters).map(ck => {
      const width = columnFilters[ck].end ? 6 : 4;

      return <Grid key={ck} item md={width} mb={6}>
        <FormControlLabel 
          control={
            <Checkbox key={ck} id={ck} name={ck} checked={columnFilters[ck].checked} onChange={(e) => this.onColumnFilters(e)} />
          }
          label={columnFilters[ck].label}
        />
      </Grid>
    })
    let bound = storejs.get('bounds', null);

    let columns = [];
    let timestamp = new Date().getTime();
    this.columns.map(c => {
      if (this.columnFilters[c.selector] && this.columnFilters[c.selector].checked == true) {
        columns.push(c);
      }
      if (c.selector == 'geom') {
        columns.push(c);
      }
    })

    // Responsive width for asset table.
    let tableWidth = (window.innerWidth - 100).toString() + 'px';
    if (window.innerWidth > 860) {
      tableWidth = "100%";
    }

    let direction = this.props.sort_direction == 'asc' ? true : false;

    return (
      <ListView container spacing={6}>
        <Grid item md={6} mb={6} className="label">
          <span className="t-label pavements active">{this.props.total} Plots</span>

          {bound && <FormControlLabel
            style={{marginLeft: '10px'}}
            control={
              <Switch
                checked={mapped}
                onChange={(e) => this.onShowMapped(e)}
                value="mapped"
              />
            }
            label="In View"
          />}
        </Grid >
        <Grid item md={6} mb={6} className="actions">
          <div style={{marginRight: '25px'}}>
            <Button mr={2} title="Download Plots" color="primary" onClick={()=>this.downloadFile()} variant="outlined">
              <CloudDownload />
            </Button>
          </div>
        </Grid>
        <Grid item md={12} mb={6} className="asset-list" style={{padding: '0px'}}>
          {this.state.loader && <img src="/static/img/load.gif" style={{width: '70px', position: 'absolute', zIndex: '1', left: '47%', top: '50%'}} />}
        </Grid>
        <Grid item md={12} mb={6} className="asset-list">
          {Object.keys(this.state.filterBubbles).map(ft => {
            return <span className="filter-icon"><b>{ft}</b>: {this.state.filterBubbles[ft]} <CloseIcon onClick={()=>this.removeFilter(ft)}/></span>
          })}
        </Grid>
        <Grid item md={12} mb={6} className="asset-list" onScroll={(e) => this.handleScroll(e)} id="table-scroll">
          <DataTable
            columns={columns}
            data={data}
            noHeader={true}
            style={{width: tableWidth}}
            progressPending={loading}
            persistTableHead
            onRowClicked={(e) => this.onRowClick(e)}
            highlightOnHover={true}
            pointerOnHover={true}
            onSort={(column, direction, e) => this.onSort(column, direction, e)}
            sortServer={true}
            defaultSortField={this.props.sort_column}
            defaultSortAsc={direction}
            dense />
        </Grid>
        <Dialog
          open={this.state.assetDetail}
          onClose={(e)=>this.setState({assetDetail: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="xl"
          fullWidth={true}
        >
          <DialogContent>
            <AssetDetail 
              assetId={this.state.selectedAsset}
              onReload={() => {this.onReload()}}
              closeAssetDetail={() => {this.setState({assetDetail: false})}}
              setSelectedAsset={(id) => {this.setState({selectedAsset: id})}}
              closeAndNew={() => {this.closeAndNew()}} />
          </DialogContent>
        </Dialog>
        <Dialog
          open={this.state.columnDialog}
          onClose={(e)=>this.setState({columnDialog: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
          fullWidth={true}
        >
          <DialogTitle id="form-dialog-title">Custom columns</DialogTitle>
          <DialogContent>
            <FormControl component="fieldset">
              <Grid container>
                {availableColumns}
              </Grid>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.handleClose(e, 'columnDialog')} color="primary" variant="contained" >
              SAVE
            </Button>
            <Button onClick={(e)=>this.setState({columnDialog: false})} color="primary" variant="outlined" >
              CANCEL
            </Button>
          </DialogActions>
        </Dialog>
      </ListView>
    )
  }
}


export default connect(
  (store) => {
    return {
      assets: store.assetReducer,
      filters: store.filterReducer
    }
  }, (dispatch) =>{
    return {
      set_asset: (assets) => {
        dispatch(setAsset(assets))
      },
      set_filter: (filter) => {
        dispatch(setFilter(filter))
      },
      set_global_filter: (filter) => {
        dispatch(setGlobalFilter(filter))
      }
    }
  }
)(withTheme(AssetATableView));
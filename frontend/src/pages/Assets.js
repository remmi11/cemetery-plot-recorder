import React, { Component } from "react";
import styled, { withTheme } from "styled-components";

import Helmet from 'react-helmet';
import { darken } from "polished";

import {
  Grid,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Paper as MuiPaper,
  FormControl as MuiFormControl,
  MenuItem,
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  InputBase,
  Snackbar,
  CircularProgress
} from "@material-ui/core";

import {
  Search as SearchIcon,
  Map,
  List as ListIcon,
  DollarSign,
  PlusCircle,
  Upload,
  X as XIcon
} from "react-feather";

import { spacing } from "@material-ui/system";

import TableView from "./assets/TableView"
import MapView from "./assets/MapView"
import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import { DropzoneArea } from 'material-ui-dropzone'
import storejs from 'store';
import { connect } from "react-redux";

import ApiInterface from '../lib/ApiInterface.js';
import { setAsset } from '../redux/actions/assetActions.js'
import { setFilter } from '../redux/actions/filterActions.js'
import { Alert as MuiAlert } from '@material-ui/lab';
import * as config from '../config.js';
import AssetDetail from './assets/AssetDetail'

// Local style objects
const Card = styled(MuiCard)(spacing);
const CardContent = styled(MuiCardContent)(spacing);
const Paper = styled(MuiPaper)(spacing);
const Button = styled(MuiButton)(spacing);

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
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
  }

  &.close-icon {
    top: 0px;
    right: 0px;
    cursor: pointer;
  }
`;

const ToggleMenu = styled(Grid)`
  > button {
    margin: 0px;
    border-radius: 0px;
    border-color: #cacaca;
  }

  > .treatment-view {
    margin-right: 100px;
    border-radius: 0px 4px 4px 0px;
  }
  > .map-view {
    border-radius: 4px 0px 0px 4px;
  }
`;

const Input = styled(InputBase)`
  color: inherit;
  width: 90%;

  > input {
    color: ${props => props.theme.header.search.color};
    padding-top: ${props => props.theme.spacing(2.5)}px;
    padding-right: ${props => props.theme.spacing(2.5)}px;
    padding-bottom: ${props => props.theme.spacing(2.5)}px;
    padding-left: ${props => props.theme.spacing(12)}px;
    width: 160px;
  }
`;
const FormControlSpacing = styled(MuiFormControl)(spacing);

const FormControl = styled(FormControlSpacing)`
  min-width: 148px;
`;
const Alert = styled(MuiAlert)(spacing);

// The parent component to wrap AssetATableView and AssetMapView components.
class Assets extends Component {
  constructor(props) {
    super(props);

    let toggle = 'map';
    if (this.props.location.search.includes('table')) {
      toggle = 'table';
    } else if (this.props.location.search.includes('map')) {
      toggle = 'map';
    }

    let filter = storejs.get('filter', {});

    this.state = {
      toggle: toggle,
      createDialog: false,
      notification: false,
      notification_text: "",
      error: "",
      assets: {},
      filter: filter,
      page: 1,
      total: 0,
      bbox: null,
      globalFilter: "",
      notification_type: "success",
      sort_column: 'asset_id',
      sort_direction: 'asc',
      filterClose: false,
      mapped: true,
      assetDetail: false,
      selectedAsset: "new"
    }

    this.assets = [];
  }

  // The event function to open 'Create Asset' or 'Upl'
  onAsset(type) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;
    let {asset} = this.state;

    if (type == 'create') {
      this.setState({createDialog: true})
    }
  }

  onToggle(toggle) {
    this.setState({toggle})
    storejs.set('assetPrePage', toggle);
  }

  // Filter functions
  onUpdateFilter(filter) {
    storejs.set('filter', filter);
    this.setState({filter})
  }
  onUpdateGlobalFilter(globalFilter) {
    this.setState({globalFilter})
  }
  onUpdateSort(sort) {
    this.setState({sort})
  }
  onMapped(mapped) {
    this.setState({mapped})
  }

  convertPointFormat(geo) {
    console.log("inside convertPointFormat...")
    return "SRID=4326;POINT (" + geo.join(" ") + ")";
  }

  getDataFromServer(filter, globalFilter, page=1, sort=null, gf=null, isBbox=true) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    let { assets } = this.state

    let tfitler = {}
    Object.assign(tfitler, filter);

    tfitler['global'] = globalFilter;
    tfitler['page'] = page;

    if (sort && sort.column) {
      tfitler['column'] = sort.column;
    }
    if (sort && sort.direction) {
      tfitler['direction'] = sort.direction;
    }

    if (storejs.get('bounds', null)) {
      tfitler['bound'] = storejs.get('bounds', null).join(',')
    }    
    if (filter['mapped'] == undefined) {
      tfitler['mapped'] = this.state.mapped
    }
    if (gf) {
      tfitler['gf'] = 1
    }

    Object.keys(tfitler).forEach(key => {
      try {
        tfitler[key] = tfitler[key].split("'")[0]
      } catch (e) {}
    })

    api.call('api/geojson/', tfitler, function(res){
      if (assets && assets.features && res.geojson.features && page != 1) {
        let tempAssets = {features: []}
        tempAssets.features = assets.features.map(asset => asset)
        res.geojson.features.forEach((item) => {
          tempAssets.features.push(item)
        })
        assets = tempAssets
      } else {
        assets = res.geojson;
      }

      console.log('got geojson response....', assets, res.bbox)

      let temp = {assets: assets, total: res.total, page: page, bbox: res.bbox};
      if (sort) {
        temp.sort_column = sort.column;
        temp.sort_direction = sort.direction;
      }

      self.props.set_asset(assets);
      self.setState(temp);
      self.assets = assets;
    })
  }

  // init function to load the assets with geojson format.
  componentDidMount() {
    let filter = storejs.get('filter', {});
    let token = storejs.get('token', null);
    let api = new ApiInterface(token.access);
    let self = this;

    let globalFilter = storejs.get('globalFilter');

    if (globalFilter) {
      this.getDataFromServer(filter, globalFilter);
    } else {
      this.getDataFromServer(filter, "");
    }

    if (globalFilter && globalFilter != '') {
      this.setState({globalFilter: globalFilter, filter: filter, filterClose: true})
    }
  }

  reload() {
    let filter = storejs.get('filter', {});
    let globalFilter = storejs.get('globalFilter');

    if (globalFilter) {
      this.getDataFromServer(filter, globalFilter);
    } else {
      this.getDataFromServer(filter, "");
    }

    console.log(" inside reload...")
  }

  // The event function to create new asset.
  handleSubmit(e) {
    let { asset, filter, globalFilter } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;
    let user = storejs.get('user')

    
  }

  setAssets(assets) {
    this.setState({assets})
  }

  handleChange(e, type) {
    let { asset, treatments } = this.state;
    let temp = {};

    asset[e.target.name] = e.target.value;

    temp['asset'] = asset;
    temp['error'] = "";
    // this.setState(temp);
  }
  handleClose() {
    this.setState({notification: false})
  }

  // global search to search the assets by asset id and name.
  onGlobalFilter(e) {
    let {assets, globalFilter, filter} = this.state;
    // assets = JSON.parse(JSON.stringify(this.props.assets.assets));

    if (true) {
      let params = {globalFilter: e.target.value}
      this.getDataFromServer(filter, e.target.value, 1, null, false, false);
      storejs.set('globalFilter', e.target.value);

      if (e.target.value && e.target.value != '') {
        params['filterClose'] = true
      } else {
        params['filterClose'] = false
      }

      this.setState(params)
    }
  }

  onSearch(e) {
    if (e.key === 'Enter') {
      let {assets, globalFilter, filter} = this.state;
      this.getDataFromServer(filter, e.target.value, 1, null, false);
    }
  }

  clearFilter() {
    storejs.set('globalFilter', '');
    this.getDataFromServer({}, '');
    this.setState({filterClose: false, globalFilter: '', filter: {}})
  }

  closeAndNew = () => {
    const self = this;
    this.setState({selectedAsset: 'new', assetDetail: false});

    setTimeout(() => {
      self.setState({assetDetail: true});
    }, 1000)
  }

  render() {
    const { asset, toggle, filterClose} = this.state;
    const user = storejs.get('user', {});

    const mapActive = toggle == 'map' ? 'contained' : 'outlined';
    const tableActive = toggle == 'table' ? 'contained' : 'outlined';

    return (
      <React.Fragment>
        <Helmet title="Assets" />
        <Grid container>
          <Grid item xs={12}>
            <Card>
              <CardContent pb={1}>
                <Grid container spacing={6}>
                  <Grid item md={6} mb={6}>
                    <Search>
                      <SearchIconWrapper>
                        <SearchIcon />
                      </SearchIconWrapper>
                      <Input placeholder="Search" value={this.state.globalFilter} onChange={(e) => this.onGlobalFilter(e)} onKeyPress={(e) => this.onSearch(e)} />
                      {filterClose && <SearchIconWrapper className="close-icon">
                        <Button onClick={(e) => this.clearFilter()}><XIcon /></Button>
                      </SearchIconWrapper>}
                    </Search>
                  </Grid>
                  <ToggleMenu item md={6} mb={6}>
                    <Button mr={2} variant={mapActive} color="primary" onClick={(e) => {this.setState({toggle: 'map'}); storejs.set('assetPrePage', 'map');}} className="map-view">
                      <Map />
                    </Button>
                    <Button mr={2} variant={tableActive} color="primary" onClick={(e) => {this.setState({toggle: 'table'}); storejs.set('assetPrePage', 'table');}} className="list-view">
                      <ListIcon />
                    </Button>
                  </ToggleMenu>
                </Grid>

                {this.state.toggle == 'map' && <MapView
                  lAssets={this.state.assets} 
                  bbox={this.state.bbox} 
                  filter={this.state.filter}
                  globalFilter={this.state.globalFilter}
                  createDialog={this.state.createDialog}
                  getDataFromServer={(filter, globalFilter, page, sort, gf, isBbox) => this.getDataFromServer(filter, globalFilter, page, sort, gf, isBbox)}
                  onToggle={(toggle) => this.onToggle(toggle)}
                  setAssets={(assets) => this.setAssets(assets)}
                  onUpdateFilter={(filter) => this.onUpdateFilter(filter)} 
                  convertPointFormat={(geo) => this.convertPointFormat(geo)} 
                  onMapped={(mapped) => this.onMapped(mapped)}
                />}
                {this.state.toggle == 'table' && <TableView
                  lAssets={this.state.assets}
                  bbox={this.state.bbox}
                  filter={this.state.filter}
                  globalFilter={this.state.globalFilter}
                  mapped={this.state.mapped}
                  total={this.state.total}
                  page={this.state.page}
                  sort_column={this.state.sort_column}
                  sort_direction={this.state.sort_direction}
                  getDataFromServer={(filter, globalFilter, page, sort) => this.getDataFromServer(filter, globalFilter, page, sort)}
                  setAssets={(assets) => this.setAssets(assets)}
                  onUpdateFilter={(filter) => this.onUpdateFilter(filter)}
                  onUpdateSort={(sort) => this.onUpdateSort(sort)}
                  onMapped={(mapped) => this.onMapped(mapped)}
                />}
              </CardContent>
              <Paper>
              </Paper>
            </Card>
          </Grid>
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
              onReload={()=>this.reload()}
              closeAssetDetail={() => {this.setState({assetDetail: false})}}
              setSelectedAsset={(id) => {this.setState({selectedAsset: id})}}
              closeAndNew={() => {this.closeAndNew()}} />
          </DialogContent>
        </Dialog>

        <Dialog
          open={this.state.createDialog}
          onClose={(e)=>this.setState({createDialog: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
          fullWidth={true}
        >
          <ValidatorForm ref="form" onSubmit={(e) => this.handleSubmit(e)} onError={errors => console.log(errors)}>
          <DialogTitle id="form-dialog-title">New Asset</DialogTitle>
          <DialogContent>
            
          </DialogContent>
          <DialogActions>
            
          </DialogActions>
          </ValidatorForm>
        </Dialog>

        <Snackbar 
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={this.state.notification}
          autoHideDuration={3000}
          onClose={() => this.handleClose()}
        >
          <Alert severity={this.state.notification_type}>{this.state.notification_text}</Alert>
        </Snackbar>
      </React.Fragment>
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
      }
    }
  }
)(withTheme(Assets));

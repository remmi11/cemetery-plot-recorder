import React, { Component } from "react";
import styled, { withTheme } from "styled-components";
import { connect } from "react-redux";
import { Source } from "react-mapbox-gl";
import Geocoder from 'react-mapbox-gl-geocoder'

import storejs from 'store';

import {
  Grid,
  Button as MuiButton,
  FormControlLabel,
  FormControl,
  FormGroup,
  MenuItem,
  Select as MuiSelect,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Checkbox,
  DialogTitle
} from "@material-ui/core";

import {
  CloudDownload,
  Tune,
  NotificationImportant,
  Close as CloseIcon
} from "@material-ui/icons";

import { spacing } from "@material-ui/system";

import {
  Layers
} from "react-feather";

import ReactMapboxGl, {
  Layer, ZoomControl, ScaleControl, Popup
} from 'react-mapbox-gl';
import DrawControl from 'react-mapbox-gl-draw'

import { setAsset } from '../../redux/actions/assetActions.js'
import { setFilter } from '../../redux/actions/filterActions.js'
import * as config from '../../config.js'
import ApiInterface from '../../lib/ApiInterface.js';
import AssetDetail from './AssetDetail'

const Button = styled(MuiButton)(spacing);
const Select = styled(MuiSelect)(spacing);

// Local style objects
const MapViewWrapper = styled(Grid)`
  @media (min-width: 960px) {
    .action-group {
      margin-top: -57px;
    }
    .mapboxgl-map {
      height: calc(100vh - 235px);
      width: 100%;
      marginBottom: 10px
    }
  }
  @media (max-width: 960px) {
    .mapboxgl-map {
      min-height: 300px;
    }
  }
  .action-group {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 560px) {
    .oci-category {
      display: block !important;
    }
    .action-group {
      display: block !important;
    }
  }
  .oci-category {
    display: flex;
    justify-content: flex-end;

    .title {
      font-weight: bold;
      margin-right: 10px;
    }
    @media (max-width: 960px) {
      .title {
        display: none;
      }
    }
    .icon-label {
      margin: 0px 10px;
      display: flex;
      cursor: pointer;
    }
    .status {
      width: 8px;
      height: 8px;
      margin-top: 5px;
      margin-right: 5px;
    }
  }

  canvas {
    cursor: default;
  }

  .filter-dialog {

  }

  .react-geocoder {
    position: absolute;
    top: 190px;
    z-index: 1001;
    right: 30px;
  }
  .react-geocoder-results {
    background: white;
    position: absolute;
    min-width: 280px;
    right: 5px;
    padding: 10px;
    box-shadow: 1px 1px 4px 0px grey;

    input {
      padding: 5px;
    }
  }
  .react-geocoder-item {
    border-bottom: 1px solid #d1d1d1;
    cursor: pointer;
    padding: 5px 0px;
  }
  .react-geocoder-item:hover {
    background: #d1d1d1;
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

const LayerControl = styled.div`
  position: absolute;
  z-index: 1001;
  background: white;
  padding: 4px 5px 0px 5px;
  box-shadow: 1px 1px 5px 1px #9a9898;
  right: 31px;
  margin-top: 10px;
  height: 30px;
  cursor: pointer;

  svg {
    width: 19px;
  }
`

const LayerPanel = styled.div`
  position: absolute;
  z-index: 1001;
  background: white;
  padding: 7px 25px;
  box-shadow: 1px 1px 5px 1px #9a9898;
  right: 31px;
  margin-top: 10px;

  .MuiRadio-root, .MuiCheckbox-root {
    padding: 4px 10px;
  }
`

// Define the map object.
const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1Ijoid3RnZW9ncmFwaGVyIiwiYSI6ImNrNXk3dXh6NzAwbncza3A1eHlpY2J2bmoifQ.JRy79QqtwUTYHK7dFUYy5g'
});

const StyledPopup = styled.div`
  background: white;
  color: black;
  font-weight: 400;
  padding: 5px;
  border-radius: 2px;
  font-size: 14px;

  .title {
    font-weight: bold;
    font-size: 14px;
  }
  .oci-category {
    justify-content: flex-start !important;

    .icon-label {
      display: flex;
      margin-bottom: 10px;
      margin-top: 10px;
    }
    .status {
      background: rgb(0, 0, 0);
      width: 20px;
      margin-right: 10px;
    }
  }
  .p-type {
    margin-left: 25px;
  }
  .p-function {
    margin-left: 4px;
  }
  .value {
    font-size: 15px;
    font-weight: bold;
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

const mapAccess = {
  mapboxApiAccessToken: 'pk.eyJ1Ijoid3RnZW9ncmFwaGVyIiwiYSI6ImNrNXk3dXh6NzAwbncza3A1eHlpY2J2bmoifQ.JRy79QqtwUTYHK7dFUYy5g'
}
 
const queryParams = {
  country: 'us'
}

const FilterIcon = styled.div`
  position: absolute;
  top: -12px;
  right: -12px;
  .MuiSvgIcon-root {
    color: red;
  }
`

const SearchInput = (props) => <input {...props} placeholder="Search Address" value="" />

// The component for asset map view
class MapView extends Component {
  constructor(props) {
    super(props);

    let user = storejs.get('user');

    let bound = [
      [-100.022393, 36.1248534], // Southwest coordinates
      [-100.011866, 36.1307898] // Northeast coordinates
    ];

    storejs.set('bounds', bound);

    this.state = {
      filterDialog: false,
      detailDialog: false,
      selected: null,
      assets: [],
      geojson: null,
      bbox: bound,
      property: null,
      timestamp: 12,
      bounds: bound,
      filter: {},
      filterBubbles: {},

      detailInfo: {},
      // mapLayer: 'mapbox://styles/wtgeographer/cky1pualh4lid14qit4qrhack',
      mapLayer: 'mapbox://styles/wtgeographer/cm5cq7y7n002n01s9ch4u695o',
      showMapLayer: true,

      floods: false,
      cityLimits: false,
      parcels: false,
      sections: false,
      counties: [],

      filterIcon: false,

      option: {
        "type": "vector",
        "tiles": [config.DEV_IPS[config.env] + '/api/get-tile/{z}/{x}/{y}.mvt', ],
        'minzoom': 16,
      },

      viewport: {},
      assetDetail: false,
      selectedAsset: null,

      center: [-100.0174217, 36.1279298],
      isFirstLoad: true,
    }

    this.tileUrl = config.DEV_IPS[config.env] + '/api/get-tile/{z}/{x}/{y}.mvt?'
    this.filter = {};
    this.drawControl = null;
    this.loaded = false;

    this.layerRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);

  }

  // init function
  componentDidMount() {
    let {option} = this.state;
    let { filter, globalFilter } = this.props;
    const self = this;
    let isFilered = false;

    let url = "";
    let filterBubbles = {};
    Object.keys(filter).map(key => {
      if (key != 'page') {
        url += key + "=" + filter[key] + "&";
      }
      if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng', 'gf'].includes(key) && filter[key] != '') {
        isFilered = true;
        filterBubbles[key] = filter[key]
      }
    })
    if (globalFilter && globalFilter != '') {
      url += "global=" + globalFilter + "&";
    }

    this.setState({filter, option: {...option, tiles: [this.tileUrl + url]}, center: this.state.center, filterIcon: isFilered, filterBubbles})

    storejs.set('assetPrePage', 'map');
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentDidUpdate(nextProps) {
    let {bbox} = this.props;
    let {isFirstLoad} = this.state;

    if (isFirstLoad && nextProps.bbox != bbox && bbox) {
      storejs.set('bounds', bbox)
      this.setState({bbox: bbox, isFirstLoad: false})
    }

  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  onSelected = (viewport, item) => {
    let {filter, globalFilter} = this.props;
    this.setState({viewport});

    let center = item.center;
    filter['mapped'] = true;
    this.props.getDataFromServer(filter, globalFilter, 1, null, null, false);
    this.props.onMapped(true);
  }

  handleClickOutside(event) {
    if (this.layerRef && this.layerRef.current && !this.layerRef.current.contains(event.target)) {
      this.setState({showMapLayer: false})
    }
  }

  // The event functions to show the tooltip on the map.
  showTooltip(e, properties) {
    this.setState({selected: e.lngLat, property: properties})
  }

  hideTooltip(e) {
    this.setState({selected: null})
  }

  // The event function to go to the asset detail page, when clicking on the line (map)
  onClick(e, properties) {
    window.location.href="/assets/detail/" + properties.pk;
  }

  // The function to calculate the bound of map based on a line or a group of line.
  getBounds(coordinates) {
    var minLat = 180, maxLat = -180, minLng = 90, maxLng = -90;

    if (!coordinates || coordinates.features.length == 0) {
      // return [[-117.3829317, 29.5737553],[-73.729801, 45.3444482]]
      return null
    }

    coordinates.features.map(coordinate => {
      coordinate = coordinate.geometry.coordinates
      var latitude = parseFloat(coordinate[0]),
          longitude = parseFloat(coordinate[1]);

      if (minLat > latitude) minLat = latitude;
      if (maxLat < latitude) maxLat = latitude;
      if (minLng > longitude) minLng = longitude;
      if (maxLng < longitude) maxLng = longitude;

      return coordinate;
    });
    if (minLat === maxLat || minLng === maxLng)
      return undefined;

    if (minLat == 180) {
      return [[-180, -90], [180, 90]];
    }

    let offset = 0.1;
    minLat = minLat - offset > -180 ? minLat - offset : -180;
    minLng = minLng - offset > -90 ? minLng - offset : -90;
    maxLat = maxLat + offset < 180 ? maxLat + offset : 180;
    maxLng = maxLng + offset < 90 ? maxLng + offset : 90;
    return [[minLat, minLng], [maxLat, maxLng]];
  }

  // The event function to clear the filters on 'custom filter'
  clearFilter(e) {
    this.setState({filter: {}, filterIcon: false});
    this.applyFilter(e, {});
  }

  // The event function to edit the fields in 'advanced filter' dialog.
  handleFilters(e, type) {
    let { filter } = this.state;

    filter[e.target.name] = e.target.value;
    this.setState({filter})
  }

  getCounty(join_type) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    api.call('api/ajax_load_counties/', {join_type: join_type}, function(res){
      self.setState({counties: res})
    })
  }

  // The event function to apply the advanced filters.
  applyFilter(e, filter) {
    filter = filter ? filter : this.state.filter;
    let {globalFilter} = this.props;
    let {option} = this.state;
    let isFilered = false;
    let filterBubbles = {};

    let url = "";
    Object.keys(filter).map(key => {
      if (key != 'page') {
        url += key + "=" + filter[key] + "&";
      }
      if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng'].includes(key) && filter[key] != '') {
        isFilered = true;
        filterBubbles[key] = filter[key];
      }
    })
    this.setState({filterDialog: false, option: {...option, tiles: [this.tileUrl + url]}, filterIcon: isFilered, filterBubbles});
    this.props.onUpdateFilter(filter);

    this.props.getDataFromServer(filter, globalFilter, 1, null, false)
  }

  removeFilter(rKey) {
    let {globalFilter, lAssets} = this.props;
    let {filter, option} = this.state;
    let isFilered = false;
    let filterBubbles = {};
    let uFilter = {}

    Object.keys(filter).forEach(key => {
      if (key != rKey) {
        uFilter[key] = filter[key];
      }
    })

    let url = "";
    Object.keys(uFilter).map(key => {
      if (key != 'page' && key != rKey) {
        url += key + "=" + uFilter[key] + "&";
      }
      if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng'].includes(key) && uFilter[key] != '') {
        isFilered = true;
        filterBubbles[key] = uFilter[key]
      }
    })
    this.setState({filterDialog: false, option: {...option, tiles: [this.tileUrl + url]}, filterIcon: isFilered, filter: uFilter, filterBubbles});
    this.props.onUpdateFilter(uFilter);

    this.props.getDataFromServer(uFilter, globalFilter, 1, null, false)
  }

  onClickMap(map, e) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let { filter, globalFilter, showPlotDialog: showPlotDialog } = this.props;
    const self = this;

    delete filter['page'];

    filter['lat'] = e.lngLat.lat;
    filter['lng'] = e.lngLat.lng;
    
    // console.log("Map click =>", filter);

    api.call('api/get-assets/', filter, function(res){
      let lat = e.lngLat.lat, lng = e.lngLat.lng;
      if (res.length > 0) {
        if (res[0].geom) {
          let geom = res[0].geom.split("((")[1].split("))")[0].split(',')[0].split(' ')
          lat = parseFloat(geom[1]);
          lng = parseFloat(geom[0]);

          // this.setState({assetDetail: true, selectedAsset: res[0].id});
          showPlotDialog(res[0].id);

          // console.log("map click -> data loaded -> count =", res.length, " |", res)
          // console.log("lat, lng:", lat, lng, res);

        }
      } else {
        console.log("Error in plot details API...")
      }
    })
  }

  changeTyleLayer(e, type) {
    let temp = {}
    temp[type] = e.target.checked
    this.setState(temp)
  }

  onZoom(map, event) {
    let {filter, globalFilter} = this.props;
    let bounds = map.getBounds();    
    bounds = [bounds._sw.lng, bounds._sw.lat, bounds._ne.lng, bounds._ne.lat];
    storejs.set('bounds', bounds);

    filter['mapped'] = true;
    this.props.getDataFromServer(filter, globalFilter, 1, null, null, false);
    this.props.onMapped(true);
  }

  closeAndNew = () => {
    const self = this;
    this.setState({selectedAsset: 'new', assetDetail: false});

    setTimeout(() => {
      self.setState({assetDetail: true});
    }, 1000)
  }

  render() {
    let {bbox, timestamp, bounds, mapLayer, filterIcon} = this.state;

    return (
      <MapViewWrapper container mb={6}>
        <Grid item md={8} mb={6} className="label">
        </Grid >
        <Grid item md={4} mb={6} xs={12} className="actions">
          <div className="action-group" style={{padding: '20px 0px'}}>
            <Button mr={2} color="primary" variant="outlined" onClick={(e)=>this.setState({filterDialog: true})} style={{display: 'none'}}>
              <Tune />
              { filterIcon && <FilterIcon>
                <NotificationImportant />
              </FilterIcon>}
            </Button>
          </div>
        </Grid>
        <Grid style={{minHeight: '40px'}}>
          {Object.keys(this.state.filterBubbles).map(ft => {
            return <span className="filter-icon"><b>{ft}</b>: {this.state.filterBubbles[ft]} <CloseIcon onClick={()=>this.removeFilter(ft)}/></span>
          })}
        </Grid>        
        <Grid item md={12} mb={6} xs={12}>
          {/* <Geocoder
            {...mapAccess} onSelected={this.onSelected} viewport={viewport}
            queryParams={queryParams}
            inputComponent={SearchInput}
          /> */}
          <Map key={timestamp}
            style={mapLayer}
            center={this.state.center}
            maxZoom={24}
            fitBounds={bbox}
            maxBounds={bounds}
            onClick = {(map, evt) => this.onClickMap(map, evt)}
            onZoomEnd = {(map, evt) => this.onZoom(map, evt)}
            onDragEnd = {(map, evt) => this.onZoom(map, evt)}
          >
            <Source id='cemeterydata' tileJsonSource={this.state.option} />
            <Layer
              id='cemeterydata-polygon'
              type='fill'
              sourceId='cemeterydata'
              sourceLayer='default'
              paint={{
                'fill-color': '#0080ff',
                'fill-opacity': 0.5
              }}  
            />
            <Layer
              id='cemeterydata-outline'
              type='line'
              sourceId='cemeterydata'
              sourceLayer='default'
              paint={{
                'line-color': '#0067c5',
                'line-width': 3
              }}
            />
            <Layer
              id='cemeterydata-labels'
              type='symbol'
              sourceId='cemeterydata'
              sourceLayer='default'
              minZoom={18}
              layout={{
                'text-field': "Plot: {plot}",
					      'text-font': [
                    "DIN Offc Pro Medium",
                    "Arial Unicode MS Bold"
                  ],
                  'text-size': 10,
                  'symbol-placement': 'point',
                  'text-anchor': 'center'
              }}
              paint={{
                'text-color': '#000000'
              }}
            />
            <Layer
              id='cemeterydata-form-labels'
              type='symbol'
              sourceId='cemeterydata'
              sourceLayer='default'
              minZoom={18}
              layout={{
                'text-field': [
                  'case',
                  ['!=', ['get', 'last_name'], null],
                  ['get', 'last_name'],
                  '', // Otherwise, show nothing
                ],               
					      'text-font': [
                  "DIN Offc Pro Medium",
                  "Arial Unicode MS Bold"
                ],
                'text-size': 10,
                'symbol-placement': 'point',
                'text-anchor': 'center'
              }}
              paint={{
                'text-color': '#FF0000'
              }}
            />
            <ZoomControl position="top-left" />
            <ScaleControl measurement="mi" />
          </Map>
        </Grid>

        <Dialog
          open={this.state.detailDialog}
          onClose={(e)=>this.setState({detailDialog: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="xs"
        >
          <DialogTitle id="form-dialog-title">Asset Detail</DialogTitle>
          <DialogContent>
            <StyledPopup>
            <GridContent container>
              <Grid item md={4} xs={12} className="value">
                Functional Classification:
              </Grid>
              <Grid item md={8} xs={12} className="value">
              </Grid>
              <Grid item md={4} xs={12} className="value">
                  Surface Type:
              </Grid>
              <Grid item md={8} xs={12} className="value">
              </Grid>
            </GridContent>
            </StyledPopup>
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.setState({detailDialog: false})} color="primary" variant="outlined" >
              CANCEL
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={this.state.assetDetail}
          onClose={(e)=>this.setState({assetDetail: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="xl"
          fullWidth={true}
        >
          <DialogContent>
            <AssetDetail assetId={this.state.selectedAsset}
              onReload={()=>this.onReload()}
              closeAssetDetail={() => {this.setState({assetDetail: false})}}
              setSelectedAsset={(id) => {this.setState({selectedAsset: id})}}
              closeAndNew={() => {this.closeAndNew()}} />
          </DialogContent>
        </Dialog>

      </MapViewWrapper>
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
    }
  }
)(withTheme(MapView));
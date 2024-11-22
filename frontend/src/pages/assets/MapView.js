import React, { Component } from "react";
import styled, { withTheme } from "styled-components";
import { connect } from "react-redux";
import { Source, GeoJSONLayer } from "react-mapbox-gl";
import Geocoder from 'react-mapbox-gl-geocoder'

import storejs from 'store';

import {
  Grid,
  Button as MuiButton,
  IconButton as MuiIconButton,
  FormControlLabel,
  FormControl,
  FormGroup,
  MenuItem,
  InputLabel,
  Select as MuiSelect,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  Radio,
  RadioGroup,
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

const symbolLayout: MapboxGL.SymbolLayout = {
  'text-field': '{place}',
  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  'text-offset': [0, 0.6],
  'text-anchor': 'top'
};
const symbolPaint: MapboxGL.SymbolPaint = {
  'text-color': 'green'
};

const circleLayout: MapboxGL.CircleLayout = { visibility: 'visible' };
const circlePaint: MapboxGL.CirclePaint = {
  'circle-color': 'blue'
};

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

    let bound = null
    if (storejs.get('bounds', null)) {
      bound = storejs.get('bounds')
      bound = [[bound[0], bound[1]], [bound[2], bound[3]]]
    }

    this.state = {
      filterDialog: false,
      detailDialog: false,
      selected: null,
      assets: [],
      geojson: null,
      bbox: bound,
      property: null,
      timestamp: 12,
      bounds: null,
      filter: {},
      filterBubbles: {},

      detailInfo: {},
      mapLayer: 'mapbox://styles/wtgeographer/cky1pualh4lid14qit4qrhack',
      showMapLayer: false,

      floods: false,
      cityLimits: false,
      parcels: false,
      sections: false,
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      counties: [],

      filterIcon: false,

      option: {
        "type": "vector",
        "tiles": [config.DEV_IPS[config.env] + '/api/get-tile/{z}/{x}/{y}.mvt', ],
        'minzoom': 6,
        'maxzoom': 20
      },

      viewport: {},
      assetDetail: false,
      selectedAsset: null,

      center: [-100.0174217, 36.1279298]
    }

    this.tileUrl = config.DEV_IPS[config.env] + '/api/get-tile/{z}/{x}/{y}.mvt?'
    this.filter = {};
    this.drawControl = null;
    this.zoom = [16];
    this.loaded = false;

    this.layerRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this)

    this.floodsTileLayer = {
      "type": "raster",
      "tiles": [
        "https://a.tiles.mapbox.com/styles/v1/wtgeographer/cjf9riogz4z8n2rmk4eawkc6o/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid3RnZW9ncmFwaGVyIiwiYSI6ImNrNXk3dXh6NzAwbncza3A1eHlpY2J2bmoifQ.JRy79QqtwUTYHK7dFUYy5g",
      ]
    }
    this.cityLimitsTileLayer = {
      "type": "raster",
      "tiles": [
        "https://a.tiles.mapbox.com/styles/v1/wtgeographer/cjftuokfx8ime2sqpyhj88q67/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoid3RnZW9ncmFwaGVyIiwiYSI6ImNrNXk3dXh6NzAwbncza3A1eHlpY2J2bmoifQ.JRy79QqtwUTYHK7dFUYy5g"
      ]
    }
    this.parcelsTileLayer = {
      "type": "raster",
      "tiles": [
        "https://gs.furmanrecords.com:443/geoserver/gwc/service/tms/1.0.0/master_geom:parcels_4326@EPSG%3A900913@png/{z}/{x}/{y}.png",
      ],
      "minzoom": 12
    }
    this.sectionsTileLayer = {
      "type": "raster",
      "tiles": [
        "https://gs.furmanrecords.com:443/geoserver/gwc/service/tms/1.0.0/master_geom%3Asections_merged_4326@EPSG%3A900913@png/{z}/{x}/{y}.png",
      ],
      "minzoom": 12
    }

    this.join_types = {
      'county': {
        'plss': 'meridian',
        'residential': 'subdivision',
        'rural': 'survey'
      },
      'level1': {
        'plss': 'town_range',
        'residential': 'unit',
        'rural': 'block'
      },
      'level2': {
        'plss': 'section',
        'residential': 'subblock',
        'rural': 'rural_section'
      },
      'level3': {
        'residential': 'lot'
      },
    }
  }

  // init function
  componentDidMount() {
    console.log(">>>>> component did mount...")
    let {option} = this.state;
    let { filter, globalFilter } = this.props;

    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    let isFilered = false;

    if (filter.join_type) {
      self.getCounty(filter.join_type)

      if (filter.join_type == 'residential') {
        self.loadLegal('county', filter, filter.county, 'init')
        self.loadLegal('level1', filter, filter.sub_name, 'init')
        self.loadLegal('level2', filter, filter.sub_unit, 'init')
        self.loadLegal('level3', filter, filter.sub_block, 'init')
      } else if (filter.join_type == 'rural') {
        self.loadLegal('county', filter, filter.county, 'init')
        self.loadLegal('level1', filter, filter.rural_survey, 'init')
        self.loadLegal('level2', filter, filter.rural_block, 'init')
      } else if (filter.join_type == 'plss') {
        self.loadLegal('county', filter, filter.county, 'init')
        self.loadLegal('level1', filter, filter.plss_meridian, 'init')
        self.loadLegal('level2', filter, filter.plss_t_r, 'init')
      }
    }

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
    // this.zoom = null;

    storejs.set('assetPrePage', 'map');
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentDidUpdate(nextProps) {
    let {option} = this.state;
    let {lAssets, createDialog, filter, globalFilter, bbox} = this.props, coordinates = [];
    let isFilered = false;
    let filterBubbles = {};

    console.log("component did update....", lAssets.features?.length, nextProps.lAssets.features?.length)

    // if (nextProps.filter != filter || nextProps.globalFilter != globalFilter) {
    //   let url = "";
    //   Object.keys(filter).map(key => {
    //     if (key != 'page') {
    //       url += key + "=" + filter[key] + "&";
    //     }
    //     if (!['mapped', 'bound', 'global', 'page', 'bbox', 'lat', 'lng', 'gf'].includes(key) && filter[key] != '') {
    //       isFilered = true;
    //       filterBubbles[key] = filter[key]
    //     }
    //   })
    //   if (globalFilter && globalFilter != '') {
    //     url += "global=" + globalFilter + "&";
    //   }
    //   this.setState({filter, option: {...option, tiles: [this.tileUrl + url]}, filterIcon: isFilered, filterBubbles})
    // }

    // if (nextProps.lAssets != lAssets) {
    //   this.setState({geojson: lAssets})
    // }
    // if (nextProps.bbox != bbox && bbox) {
    //   this.setState({bbox: bbox})
    //   storejs.set('bounds', bbox)
    // }

    console.log("Current zoom level =", this.zoom);

  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  onSelected = (viewport, item) => {
    let {filter, globalFilter} = this.props;
    this.setState({viewport});
    console.log('Selected: ', item)

    let center = item.center
    let bbox = [center[0] - 0.001, center[1] - 0.001, center[0] + 0.001, center[1] + 0.001]
    storejs.set('bounds', bbox)
    console.log("Bound for click ->", bbox)
    this.setState({bbox: bbox})

    filter['mapped'] = true
    this.props.getDataFromServer(filter, globalFilter, 1, null, null, false)
    this.props.onMapped(true)
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

    if (['join_type', 'county', 'level1', 'level2', 'level3'].includes(type)) {
      this.loadLegal(type, e)
    } else {
      filter[e.target.name] = e.target.value;
      this.setState({filter})
    }
  }

  loadLegal(type, e, value, init) {
    let { filter } = this.state;

    if (init) {
      filter = e;
    }

    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let payload = {
      join_type: filter.join_type
    }
    let url = "api/ajax_load_data/"
    const self = this;

    if (type == 'join_type') {
      let join_type = 
      this.getCounty(e.target.value)

      filter.county = ""
      filter.rural_survey = ""
      filter.rural_block = ""
      filter.rural_section = ""
      filter.plss_meridian = ""
      filter.plss_t_r = ""
      filter.plss_section = ""
      filter.sub_name = ""
      filter.sub_unit = ""
      filter.sub_block = ""
      filter.sub_lot = ""
      this.joinTypeSelection = {}

      if (!init) {
        filter[e.target.name] = e.target.value;
        this.setState({filter: filter})
      }
      return;
    } else if (type == 'county') {
      if (!init) {
        filter.rural_survey = ""
        filter.rural_block = ""
        filter.rural_section = ""
        filter.plss_meridian = ""
        filter.plss_t_r = ""
        filter.plss_section = ""
        filter.sub_name = ""
        filter.sub_unit = ""
        filter.sub_block = ""
        filter.sub_lot = ""
      }

      payload['county'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][filter.join_type]
      this.joinTypeSelection = {}
      api.create(url, payload, function(res){
        self.setState({level1: res})
      })
    } else if (type == 'level1') {
      if (!init) {
        filter.rural_block = ""
        filter.rural_section = ""
        filter.plss_t_r = ""
        filter.plss_section = ""
        filter.sub_unit = ""
        filter.sub_block = ""
        filter.sub_lot = ""
      }

      payload['county'] = filter.county
      payload['level1'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][filter.join_type]
      this.joinTypeSelection['level1'] = init ? value : e.target.value

      api.create(url, payload, function(res){
        self.setState({level2: res})
      })
    } else if (type == 'level2') {
      if (!init) {
        filter.rural_section = ""
        filter.plss_section = ""
        filter.sub_block = ""
        filter.sub_lot = ""
      }
      payload['county'] = filter.county
      payload['level1'] = this.joinTypeSelection['level1']
      payload['level2'] = init ? value : e.target.value
      this.joinTypeSelection['level2'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][filter.join_type]
      api.create(url, payload, function(res){
        self.setState({level3: res})
      })
    } else if (type == 'level3') {
      if (!init) {
        filter.sub_lot = ""
      }
      payload['county'] = filter.county
      payload['level1'] = this.joinTypeSelection['level1']
      payload['level2'] = this.joinTypeSelection['level2']
      payload['level3'] = init ? value : e.target.value
      this.joinTypeSelection['level3'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][filter.join_type]

      if (payload['type']) {
        api.create(url, payload, function(res){
          self.setState({level4: res})
        })
      }
    }

    if (!init) {
      filter[e.target.name] = e.target.value;
      this.setState({filter: filter})
    }
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
    let { filter, globalFilter } = this.props;
    const self = this;

    delete filter['page']

    filter['lat'] = e.lngLat.lat;
    filter['lng'] = e.lngLat.lng;
    console.log("Click pos =>", filter)

    api.call('api/get-asseta/', filter, function(res){
      let lat = e.lngLat.lat, lng = e.lngLat.lng;
      if (res.length > 0) {
        console.log("map click -> data loaded -> count =", res.length, " |", res)
        if (res[0].fields.geom) {
          let geom = res[0].fields.geom.split("((")[1].split("))")[0].split(',')[0].split(' ')
          lat = parseFloat(geom[1]);
          lng = parseFloat(geom[0]);
        }
        console.log("lat, lng ->", lat, lng);
        let bbox = [lng - 0.00003, lat - 0.000015, lng + 0.00003, lat + 0.000015];
        console.log('bound after click =>', bbox);
        storejs.set('bounds', bbox)
        self.setState({bbox: bbox})

        filter['mapped'] = true
        self.props.getDataFromServer(filter, globalFilter, 1, null, null, false)
        self.props.onMapped(true)
        self.props.onToggle('table')
      } else {
        // window.location.href="/assets/detail/" + res[0].pk;
        // self.setState({selectedAsset: res[0].pk, assetDetail: true});
        console.log("Error in asset details API...")
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
    console.log("zoom event...", bounds)

    storejs.set('bounds', bounds)

    filter['mapped'] = true
    this.props.getDataFromServer(filter, globalFilter, 1, null, null, false)
    this.props.onMapped(true)
  }

  closeAndNew = () => {
    const self = this;
    this.setState({selectedAsset: 'new', assetDetail: false});

    setTimeout(() => {
      self.setState({assetDetail: true});
    }, 1000)
  }

  render() {
    let {assets, bbox, geojson, property, selected, timestamp, bounds, filter, detailInfo, mapLayer, showMapLayer, viewport, filterIcon} = this.state;
    let layers = [], coordinates = [];

    let tp_bounds = null;
    // if (this.loaded == false && geojson != null) {
    //     tp_bounds = this.getBounds(geojson);
    //     this.loaded = true;
    // }

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
          {showMapLayer && <LayerPanel ref={this.layerRef}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={e => this.changeTyleLayer(e, "sections")}
                    checked={this.state.sections}
                    value="sections"
                  />
                }
                label="Sections"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={e => this.changeTyleLayer(e, "parcels")}
                    checked={this.state.parcels}
                    value="parcels"
                  />
                }
                label="Parcels"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={e => this.changeTyleLayer(e, "floods")}
                    checked={this.state.floods}
                    value="flood"
                  />
                }
                label="Flood Harzards"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={e => this.changeTyleLayer(e, "cityLimits")}
                    checked={this.state.cityLimits}
                    value="city"
                  />
                }
                label="City Limits"
              />
            </FormGroup>
          </LayerPanel>}
          <Geocoder
            {...mapAccess} onSelected={this.onSelected} viewport={viewport}
            queryParams={queryParams}
            inputComponent={SearchInput}
          />
          <Map key={timestamp}
            style={mapLayer}
            center={this.state.center}
            fitBounds={bbox}
            onClick = {(map, evt) => this.onClickMap(map, evt)}
            onZoomEnd = {(map, evt) => this.onZoom(map, evt)}
            onDragEnd = {(map, evt) => this.onZoom(map, evt)}
          >
            {selected && <Popup key={property.pk} coordinates={selected}>
              <StyledPopup>
                <div className="title">{property.asset_id} ({property.name})</div>
                <div><span className="p-title">Functional Classification:</span> <span className="p-function"></span></div>
                <div><span className="p-title">Surface Type: </span> <span className="p-type">{property.pavement_type}</span></div>
              </StyledPopup>
            </Popup>}
            {this.state.floods && <Source id="floodsTileLayer" tileJsonSource={this.floodsTileLayer} />}
            {this.state.floods && <Layer type="raster" id="floodsTileLayer" sourceId="floodsTileLayer" />}

            <Source id='mapillarysdata' tileJsonSource={this.state.option} />
            <Layer
              id='mapillarysdata'
              type='circle'
              sourceId='mapillarysdata'
              sourceLayer='default'
              paint={{
                'circle-color': ['match',
                    ['get', 'join_type'],
                    'residential',
                    '#27409a',
                    'rural',
                    '#c70f0f',
                    'plss',
                    '#d8951c',
                    'route',
                    'rgba(0,0,0,0)',
                    '#000'
                ],
              }}
            />
            <Layer
              id='mapillarysdata-line'
              type='line'
              sourceId='mapillarysdata'
              sourceLayer='default'
              paint={{
                'line-color': ['match',
                    ['get', 'join_type'],
                    'route',
                    'green',
                    '#000'
                ],
                'line-width': 3
              }}
            />
            <ZoomControl position="top-left" />
            <ScaleControl measurement="mi" />
          </Map>
        </Grid>

        <Dialog
          open={this.state.filterDialog}
          onClose={(e)=>this.setState({filterDialog: false})}
          aria-labelledby="form-dialog-title"
          maxWidth="md"
          fullWidth={true}
          className="filter-dialog"
        >
          <DialogTitle id="form-dialog-title">Advanced Filters</DialogTitle>
          <DialogContent>
            <GridContent container>
              <Grid item md={5} xs={12} style={{maxWidth: '45%', flexBasis: '45%'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    Collection:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Survey Collection</div>
                      <Select id="collection"
                      value={filter.collection || ""}
                      name="collection" onChange={(e) => this.handleFilters(e)} fullWidth>
                        <MenuItem value="APEX">Apex</MenuItem>
                        <MenuItem value="Furman Land Surveyors, Inc.">Furman Land Surveyors, Inc.</MenuItem>
                        <MenuItem value="GDI, Inc. - Amarillo">GDI, Inc. - Amarillo</MenuItem>
                        <MenuItem value="GDI, Inc. - Canadian">GDI, Inc. - Canadian</MenuItem>
                        <MenuItem value="GOLLADAY">Golladay</MenuItem>
                        <MenuItem value="KELLER">Keller</MenuItem>
                        <MenuItem value="LAMB">Lamb</MenuItem>
                        <MenuItem value="MILLER_TITUS">Miller - Titus</MenuItem>
                        <MenuItem value="TRIGG">Trigg</MenuItem>
                        <MenuItem value="DAVIS">Davis</MenuItem>
                        <MenuItem value="SEDCO">Sedco</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <FilterTitle item md={12} xs={12} style={{marginTop: '20px'}}>
                    Property Info:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="project_no" name="project_no"
                        value={filter.project_no || ""} label="Project No"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="client" name="client"
                        value={filter.client || ""} label="Client"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="requested_by" name="requested_by"
                        value={filter.requested_by || ""} label="Requested By"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="certify_to" name="certify_to"
                        value={filter.certify_to || ""} label="Certify To"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="contact_name" name="contact_name"
                        value={filter.contact_name || ""} label="Contact Name"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item md={1} xs={12}></Grid>
              <Grid item md={5} xs={12} style={{maxWidth: '45%', flexBasis: '45%'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    Property Info:
                  </FilterTitle>
                  <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="map_no" name="map_no"
                        value={filter.map_no || ""} label="Map No"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={1} xs={12}></Grid>
                  <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="contact_address" name="contact_address"
                        value={filter.contact_address || ""} label="Address"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="aka" name="aka"
                        value={filter.aka || ""} label="AKA"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <FilterTitle item md={12} xs={12} style={{'marginTop': '20px'}}>
                    Energy Clients:
                  </FilterTitle>
                  <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="well_name" name="well_name"
                        value={filter.well_name || ""} label="Well Name"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>
                  <Grid item md={1} xs={12}></Grid>
                  <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="well_number" name="well_number"
                        value={filter.well_number || ""} label="Well No"
                        onChange={(e) => this.handleFilters(e)} fullWidth />
                    </FormControl>
                  </Grid>

                  <FilterTitle item md={12} xs={12} style={{'marginTop': '20px'}}>
                    Legal:
                  </FilterTitle>
                  <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Survey Type</div>
                      <Select id="join_type"
                      value={filter.join_type || ""}
                      name="join_type" onChange={(e) => this.handleFilters(e, 'join_type')} fullWidth>
                        <MenuItem value="residential">Residential</MenuItem>
                        <MenuItem value="rural">Rural</MenuItem>
                        <MenuItem value="plss">Plss</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item md={1} xs={12}></Grid>
                  <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>County</div>
                      <Select id="county"
                      value={filter.county || ""}
                      name="county" onChange={(e) => this.handleFilters(e, 'county')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.counties.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                  {filter.join_type == 'plss' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Meridian</div>
                      <Select id="plss_meridian"
                      value={filter.plss_meridian || ""}
                      name="plss_meridian" onChange={(e) => this.handleFilters(e, 'level1')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level1.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'plss' && <Grid item md={1} xs={12}></Grid>}
                  {filter.join_type == 'plss' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Township Range</div>
                      <Select id="plss_t_r"
                      value={filter.plss_t_r || ""}
                      name="plss_t_r" onChange={(e) => this.handleFilters(e, 'level2')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level2.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'plss' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Section</div>
                      <Select id="plss_section"
                      value={filter.plss_section || ""}
                      name="plss_section" onChange={(e) => this.handleFilters(e, 'level3')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level3.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}

                  {filter.join_type == 'residential' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Subdivision</div>
                      <Select id="sub_name"
                      value={filter.sub_name || ""}
                      name="sub_name" onChange={(e) => this.handleFilters(e, 'level1')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level1.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'residential' && <Grid item md={1} xs={12}></Grid>}
                  {filter.join_type == 'residential' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Unit</div>
                      <Select id="sub_unit"
                      value={filter.sub_unit || ""}
                      name="sub_unit" onChange={(e) => this.handleFilters(e, 'level2')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level2.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'residential' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Sub Block</div>
                      <Select id="sub_block"
                      value={filter.sub_block || ""}
                      name="sub_block" onChange={(e) => this.handleFilters(e, 'level3')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level3.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'residential' && <Grid item md={1} xs={12}></Grid>}
                  {filter.join_type == 'residential' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Lot</div>
                      <Select id="sub_lot"
                      value={filter.sub_lot || ""}
                      name="sub_lot" onChange={(e) => this.handleFilters(e, 'level4')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level4.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}

                  {filter.join_type == 'rural' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Survey</div>
                      <Select id="rural_survey"
                      value={filter.rural_survey || ""}
                      name="rural_survey" onChange={(e) => this.handleFilters(e, 'level1')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level1.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'rural' && <Grid item md={1} xs={12}></Grid>}
                  {filter.join_type == 'rural' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Block</div>
                      <Select id="rural_block"
                      value={filter.rural_block || ""}
                      name="rural_block" onChange={(e) => this.handleFilters(e, 'level2')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level2.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                  {filter.join_type == 'rural' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Section</div>
                      <Select id="rural_section"
                      value={filter.rural_section || ""}
                      name="rural_section" onChange={(e) => this.handleFilters(e, 'level3')} fullWidth>
                        <MenuItem value=""></MenuItem>
                        {this.state.level3.map(county => {
                          return <MenuItem value={county}>{county}</MenuItem>
                        })}
                      </Select>
                    </FormControl>
                  </Grid>}
                </Grid>
              </Grid>
            </GridContent>
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.applyFilter(e)} color="primary" variant="contained" >
              APPLY
            </Button>
            <Button onClick={(e)=>this.clearFilter(e)} color="primary" variant="outlined" >
              CLEAR
            </Button>
            <Button onClick={(e)=>this.setState({filterDialog: false})} color="primary" variant="outlined" >
              CANCEL
            </Button>
          </DialogActions>
        </Dialog>

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
import React, { Component } from "react";
import styled, { withTheme } from "styled-components";
import PropTypes from 'prop-types';
import storejs from 'store';

import Helmet from 'react-helmet';
import DataTable from 'react-data-table-component';
import ReactMapboxGl, {
  Layer, Feature
} from 'react-mapbox-gl';
import DrawControl from 'react-mapbox-gl-draw'
import bbox from '@turf/bbox';

import { confirmAlert } from 'react-confirm-alert'; // Import

import Autocomplete from "react-google-autocomplete";

import {
  Grid,
  TextField,
  InputAdornment,
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
  Input
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
  Report,
  Warning as WarningIcon
} from "@material-ui/icons";

import { spacing } from "@material-ui/system";
import { Alert as MuiAlert } from '@material-ui/lab';

import { Link } from "react-router-dom"
import { ValidatorForm, TextValidator, SelectValidator } from 'react-material-ui-form-validator';
import ApiInterface from '../../lib/ApiInterface.js';
import * as config from '../../config.js';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

import {
  PlusCircle,
  Upload
} from "react-feather";

import Files from 'react-files'

import '../../App.css'

const DSelect = styled(MuiSelect)(spacing);
const Alert = styled(MuiAlert)(spacing);

const Typography = styled(MuiTypography)(spacing);
const Card = styled(MuiCard)(spacing);
const CardContent = styled(MuiCardContent)(spacing);
const Button = styled(MuiButton)(spacing);

// Define mapbox object
const MapPanel = ReactMapboxGl({
  accessToken:
    'pk.eyJ1Ijoid3RnZW9ncmFwaGVyIiwiYSI6ImNrNXk3dXh6NzAwbncza3A1eHlpY2J2bmoifQ.JRy79QqtwUTYHK7dFUYy5g'
});

const ASSET_COLORS = {
  'residential': '#27409a',
  'rural': '#c70f0f',
  'plss': '#d8951c',
  'route': 'green'
}

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
  .files-dropzone {
    border: 1px solid black;
    padding: 20px;
    text-align: center;
    color: #00609c;
    font-weight: bold;
    font-size: 17px;
    cursor: pointer;
    margin-top: 20px;
  }
`;

const ConfirmSection = styled(Grid)`
  .custom-ui {
    text-align: center;
    width: 620px;
    padding: 40px;
    background: #28bae6;
    box-shadow: 0 20px 75px rgba(0, 0, 0, 0.23);
    color: #fff;
  }

  .custom-ui > h1 {
    margin-top: 0;
  }

  .custom-ui > p {
    font-size: 16px;
    text-align: left;
  }

  .custom-ui > .title {
    display: flex;
    align-items: center;
    justify-content: center;

    h1 {
      margin-left: 15px;
    }
  }

  .custom-ui > button {
    width: 180px;
    padding: 10px;
    border: 1px solid #fff;
    margin: 10px;
    cursor: pointer;
    background: none;
    color: #fff;
    font-size: 14px;

    &.active {
      background: #fff;
      color: #28bae6;
    }
  }
`;

const EditForm = styled(ValidatorForm)`
  padding: 20px !important;

  .MuiFormControl-marginNormal {
    margin-top: 8px !important;
    margin-bottom: 2px !important;
  }

  .form-label {
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
  }

  .MuiInput-formControl {
    margin-top: 10px !important;
  }

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

  .save-tooltip {
    position: absolute;
    top: 83px;
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
`;

// The component for asset detail page
class AssetDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      asset: {
        ogc_fid: 1, first_name: '', middle_name: '', last_name: '', suffix: '', maiden_name: '',
        veteran: false, county: '', addition: '', unit: '', block: '',
        lot: '', plot: '', geom: '',
      },
      tab: 0,
      notification: false,
      notification_text: "",
      notification_type: 'success',

      comments: [],
      comment: {},
      commentDialog: false,
      loading: false,
      error: "",
      bounds: null,
      layers: "",
      lastInspection: {},

      clients: [],
      lenders: [],
      certifyBy: [],
      mapno: [],
      
      counties: [],
      level1: [],
      level2: [],
      level3: [],
      level4: [],
      level5: [],

      streetview: false,
      streetviewUrl: '',
      saveTooltip: false,
      saveType: 'save',
      duplication: false,

      canPathUpdate: false,

      confirmDialog: false,

      collections: [],
      bbox: [],

      isRoute: false
    }

    this.drawControl = null;
    this.center = [-101.8568, 35.1944];
    this.zoom = [11];
    this.isSuperUser = storejs.get('user').is_superuser;
    this.updateLocation = null;
    
  }

  // init function
  componentDidMount() {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    // let params = this.props.match.params;

    let { assetId } = this.props;
    const self = this;

    // api.call('api/meridians/', {}, function(res){
    //   let meridians = {};
    //   res.forEach(item => {
    //     meridians[item.code] = item.title;
    //   })
    //   self.meridians = meridians
    //   console.log(self.meridians, '>>>>>>>>')
    // })

    // api.call('api/collections/', {}, function(res){
    //   let collections = {};
    //   res.forEach(item => {
    //     collections[item.key] = item.name;
    //   })
    //   console.log(collections)
    //   self.setState({collections})
    // })

    if (assetId != 'new') {
      api.call('api/asset/' + assetId + "/", {}, function(res){
        let layers = "";
        let isRoute = false;
        let bboxValue = null;

        // if an asset is not found, redirect to map page.
        if (res.detail && res.detail == 'Not found.') {
          window.location.href = '/assets';
          return;
        }
        if (res.geom) {
          let coordinates = res.geom.split('(')[1].split(')')[0].split(' ')
          let color = ASSET_COLORS[res.join_type] ? ASSET_COLORS[res.join_type] : '#000000';

          let center = [parseFloat(coordinates[0]), parseFloat(coordinates[1])]

          if (res.join_type != 'route') {
            bboxValue = [center[0] - 0.001, center[1] - 0.001, center[0] + 0.001, center[1] + 0.001]
            
            layers = <Layer type="circle" paint={{
                  'circle-color': color
                }}>
              <Feature coordinates={center} />
            </Layer>
          } else {
            isRoute = true;
            // self.zoom = [15]

            let geoLine = []
            let i = 0
            while (i<coordinates.length) {
              console.log(coordinates[i], i)
              if (coordinates[i].includes(",") || i == coordinates.length -1) {
                if (parseFloat(coordinates[i]) == 0) {
                  geoLine.push([parseFloat(coordinates[i-2]), parseFloat(coordinates[i-1])])
                } else {
                  geoLine.push([parseFloat(coordinates[i-1]), parseFloat(coordinates[i])])
                }
              }
              i = i + 1;
            }

            const geojson = {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "properties": {
                    "id": 1
                  },
                  "geometry": {
                    "type": "LineString",
                    "coordinates": geoLine
                  }
                }
              ]
            }

            bboxValue = bbox(geojson)
            // error code
            layers = <Layer type="line" paint={{
                  'line-color': color,
                  'line-width': 3
                }}>
              <Feature coordinates={geoLine} />
            </Layer>
          }
        }

        self.setState({asset: res, layers: layers, canPathUpdate: self.checkCollection(res), isRoute: isRoute, bbox: bboxValue});
      })
    } else {
      self.getCounty()
    }

    api.call('api/ajax_data/', {type: 'clients'}, function(res){
      let filter = []
      res.forEach(item => {
        item = item.replace(/ {2,}/g, ' ').replace();

        if (item.slice(-1) == '.') {
          item = item.slice(0, -1)
        }
        if (!filter.includes(item)) {
          filter.push(item)
        }
      })
      filter = filter.map(i => {
        return {value: i, label: i}
      })
      self.setState({clients: filter})
    })
    api.call('api/ajax_data/', {type: 'certified_by'}, function(res){
      res = res.map(i => {
        return {value: i, label: i}
      })
      self.setState({certifyBy: res})
    })
    api.call('api/ajax_data/', {type: 'map_no'}, function(res){
      res = res.map(i => {
        return {value: i, label: i}
      })
      self.setState({mapno: res})
    })
    api.call('api/ajax_data/', {type: 'lenders'}, function(res){
      let filter = []
      res.forEach(item => {
        item = item.replace(/ {2,}/g, ' ').replace();

        if (item.slice(-1) == '.') {
          item = item.slice(0, -1)
        }
        if (!filter.includes(item)) {
          filter.push(item)
        }
      })
      filter = filter.map(i => {
        return {value: i, label: i}
      })
      self.setState({lenders: filter})
    })
  }

  getCounty() {
    const self = this;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let url = "api/ajax_load_data/"
    let payload = {'type': 'county'}

    api.create(url, payload, function(res){
      self.setState({counties: res})
    })

  }

  pad(n, width, z) {
    z = z || '0';
    width = width || 2;
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  buildFolderPath(asset) {
    let values = ['HTTPS://beyondmappingcom.sharepoint.com/SITES/FURMANARCHIVES/SHARED%20DOCUMENTS']

    if (asset.collection && asset.collection != '') {
      values.push(encodeURIComponent(asset.collection))
    }
    if (asset.project_no && asset.project_no != '') {
      values.push(asset.project_no)
    }

    return values.join('/')
  }

  checkCollection(asset) {
    if (!asset) {
      asset = this.state.asset;
    }
    if (!asset.collection || asset.collection == '' || asset.collection.includes('Furman') || asset.collection.includes('GDI')) {
      return false
    }
    return true
  }

  // Event function to edit each fields in an asset.
  handleChange(e, type) {
    console.log("inside handlechange....", type, e.target.name, e.target.value)

    let { asset, duplication } = this.state;
    const self = this;

    if (type == 'first_name' || type == 'last_name' || type == 'middle_name' || type == 'suffix' || type == 'maiden_name') {
      asset[type] = e.target.value;
      this.setState(asset);
    } else if (type == 'collection') {
      asset[type] = e.target.value;
      this.setState({asset, canPathUpdate: this.checkCollection(asset)});
    } else { 
      if (['county', 'addition', 'unit', 'block', 'lot', 'plot'].includes(type)) {
        self.loadLegal(type, e)
      } else {
        asset[e.target.name] = e.target.value;
        this.setState(asset);
      }
    }

    // if (e.target && e.target.name == 'project_no') {
    //   this.setState({duplication: false})
    // }
    // if (e.target && e.target.name == 'collection') {
    //   this.setState({canPathUpdate: this.checkCollection()})
    // }

    console.log(asset)


  }

  onAutoProjectNo() {
    let { asset, duplication, collections } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;

    if (asset.collection) {
      let prefix = ""
      console.log(collections)
      prefix = "ID"
      Object.keys(collections).forEach(collection => {
        if (asset.collection == collection && ['Furman Land Surveyors, Inc.', 'GDI, Inc. - Amarillo', 'GDI, Inc. - Canadian'].includes(asset.collection) === false) {
          prefix = asset.collection[0]
        }
      })

      api.create('api/ajax_auto_pn/', {collection: asset.collection}, function(res){
        if (res.pid) {
          asset.project_no = prefix + '_' + (Math.abs(res.pid) + 1).toString()
        } else {
          asset.project_no = prefix + '_1'
        }
        self.setState(asset)
      })
    } else {
      this.setState({notification_text: "Survey collection should be selected.", notification: true, notification_type: 'error'});
    }
  }

  onAutoLocation() {
    let { asset } = this.state;
    asset.folder_path = this.buildFolderPath(asset);

    this.setState({asset})
  }

  loadLegal(type, e, value, init) {
    const self = this;

    let { asset } = self.state;

    if (init) {
      asset = e;
    }

    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let payload = {}
    let url = "api/ajax_load_data/"

    if (type == 'county') {
      payload['county'] = init ? value : e.target.value
      payload['type'] = 'addition'
      api.create(url, payload, function(res){
        self.setState({level1: res})
      })
    } else if (type == 'addition') {
      payload['county'] = asset.county
      payload['addition'] = init ? value : e.target.value
      payload['type'] = 'unit'
      api.create(url, payload, function(res){
        self.setState({level2: res})
      })
    } else if (type == 'unit') {
      payload['county'] = asset.county
      payload['addition'] = asset.addition
      payload['unit'] = init ? value : e.target.value
      payload['type'] = 'block'
      api.create(url, payload, function(res){
        self.setState({level3: res})
      })
    } else if (type == 'block') {
      payload['county'] = asset.county
      payload['addition'] = asset.addition
      payload['unit'] = asset.unit
      payload['block'] = init ? value : e.target.value
      payload['type'] = 'lot'
      api.create(url, payload, function(res){
          self.setState({level4: res})
      })
    }
    else if (type == 'lot') {
      payload['county'] = asset.county
      payload['addition'] = asset.addition
      payload['unit'] = asset.unit
      payload['block'] = asset.lot
      payload['lot'] = init ? value : e.target.value
      payload['type'] = 'plot'
      api.create(url, payload, function(res){
          self.setState({level5: res})
      })
    }

    if (!init) {
      asset[e.target.name] = e.target.value;
      this.setState({asset: asset})
    }
  }

  submitForm = () => {
    let { asset, saveType, duplication } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;
    let user = storejs.get('user')

    let payload = JSON.parse(JSON.stringify(asset))

    if (this.props.assetId != 'new') {
      console.log("saving existing asset form...")

      api.update('api/asset/' + asset.id.toString() + "/", payload, function(res){
        if (saveType == 'save') {
          self.props.setSelectedAsset(asset.id.toString())
        } else if (saveType == 'new') {
          self.props.closeAndNew();
        } else {
          self.props.closeAssetDetail();
        }
        // self.onReload();
      })
    } else {
      console.log("saving new asset...", payload)
      
      api.create('api/asset_create/', payload, function(res){
        if (!res.id) {
          return;
        }
        self.setState({duplication: false})
        
        if (saveType == 'save') {
          payload.id = res.id;
          self.setState({saveTooltip: false, asset: payload});
          self.props.setSelectedAsset(res.id.toString())
        } else if (saveType == 'new') {
          self.props.closeAndNew();
        } else {
          self.props.closeAssetDetail();
        }

        console.log("new asset created...", self.props);
        self.props.onReload(); 
        self.props.closeAssetDetail(); 
        console.log("after onreload")

      })
    }
    self.setState({saveTooltip: false});

  }

  // The function to sumbit the changes of an asset.
  handleSubmit(noLot) {
    
  }

  onLocation() {
    let { asset, saveType, duplication } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;
    let user = storejs.get('user')
    let isRoute = false

    let payload = JSON.parse(JSON.stringify(asset))
    api.create('api/get_location/', payload, function(res){
      if (!res || !res.location || res.location.length == 0) {
        return
      }
      // self.center = res.location;
      // self.zoom = [17];

      let bboxValue = [res.location[0] - 0.001, res.location[1] - 0.001, res.location[0] + 0.001, res.location[1] + 0.001]

      let color = ASSET_COLORS[asset.join_type] ? ASSET_COLORS[asset.join_type] : '#000000';
      self.removeAll();
      let layers = "";
      if (asset.join_type != 'route') {
        layers = <Layer type="circle" paint={{
              'circle-color': color
            }}>
          <Feature coordinates={res.location} />
        </Layer>
      } else {
        isRoute = true
        layers = <Layer type="line" paint={{
              'line-color': color,
              'line-width': 3
            }}>
          <Feature coordinates={res.location} />
        </Layer>
      }

      console.log('>>>>><<<<<<<', bboxValue, asset.join_type, layers, isRoute, color)
      self.setState({layers: [], bbox: bboxValue, isRoute: isRoute})
      setTimeout(()=>{
        self.setState({layers: layers})
      }, 2000)
    })
  }

  // The event function to delete an asset.
  onAssetDelete(e) {
    let { asset } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let r = window.confirm("Are you sure you want to delete the selected asset?");

    if (r) {
      api.delete('api/asseta/' + asset.id + '/', function(res){
        self.setState({notification_text: "Asset deleted.", notification: true, notification_type: 'success'});
        setTimeout(function(){self.props.history.push('/assets');}, 3000);
      });
    }
  }

  onStreetView(e) {
    let { asset } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let url = 'api/street_view/' + asset.id + '/?dt=1'
    if (asset.latitude) {
      url += '&latitude=' + asset.latitude
    }
    if (asset.longitude) {
      url += '&longitude=' + asset.longitude
    }
    api.call(url, {}, function(res){
      self.setState({streetview: true, streetviewUrl: res.url})
    });
  }

  // The function to close the notification.
  handleClose() {
    this.setState({notification: false})
  }

  // The function to calculate the bound of map based on a line or a group of line.
  getBounds(coordinates) {
    if (coordinates == null) {
      return null;
    }

    var minLat = 180, maxLat = -180, minLng = 90, maxLng = -90;

    coordinates = coordinates.split('(')[1].split('}')[0].split(',')

    coordinates.map(coordinate => {
      coordinate = coordinate.trim().split(" ")
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

    let offset = 0.01;
    minLat = minLat - offset > -180 ? minLat - offset : -180;
    minLng = minLng - offset > -90 ? minLng - offset : -90;
    maxLat = maxLat + offset < 180 ? maxLat + offset : 180;
    maxLng = maxLng + offset < 90 ? maxLng + offset : 90;
    return [[minLat, minLng], [maxLat, maxLng]];
  }

  onEditGeoConfirm(feature, confirm) {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <ConfirmSection>
            <div className='custom-ui'>
              <div className="title">
                <WarningIcon /> <h1>CONFIRM</h1>
              </div>
              <p>Are you sure you want to update this project's location?</p>
              <button
                className="active"
                onClick={() => {
                  this.onEditGeo(feature, true);
                  onClose();
                }}
              >
                Yes, proceed!
              </button>
              <button onClick={() => {
                this.onEditGeo(feature, false);
                onClose();
              }}>No, cancel</button>
            </div>
          </ConfirmSection>
        );
      }
    });
  }

  onEditGeo(feature, confirm) {
    let {asset} = this.state;
    const self = this;

    if (confirm) {
      let geo = feature.features[0].geometry.coordinates;
      let color = ASSET_COLORS[asset.join_type] ? ASSET_COLORS[asset.join_type] : '#000000';

      this.removeAll();

      let geometry = "";
      let layers = "";

      console.log(geo, '>>>>>>>>>')
      if (asset.join_type != 'route') {
        geometry = "SRID=4326;POINT (" + geo.join(" ") + ")";
        layers = <Layer type="circle" paint={{
              'circle-color': color
            }}>
          <Feature coordinates={geo} />
        </Layer>
      } else {
        geometry = geo.map(g => `${g[0]} ${g[1]}`)
        geometry = "SRID=4326;LINESTRING (" + geometry + ")";
        layers = <Layer type="line" paint={{
              'line-color': color,
              'line-width': 3
            }}>
          <Feature coordinates={geo} />
        </Layer>
      }
      asset.geom = geometry;
      this.setState({layers: [], asset})
      setTimeout(()=>{
        self.setState({layers: layers})
      }, 2000)
      this.updateLocation = 'pin'
    } else {
      if (this.updateLocation == 'pin') {
        this.updateLocation = null;
      }
      this.removeAll();
    }
  }

  removeAll(feature) {
    if (this.drawControl) {
      this.drawControl.draw.deleteAll()
    }
  }

  createCollection(e) {
    let { collections } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    // api.create("api/collections/", {name: e}, function(res){
    //   collections[res.key] = res.name;
    //   self.setState({collections})
    // })
  }

  handleFileChange(files) {
    console.log(files)
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let {asset} = this.state;
    const self = this

    if (files && files.length) {
      const formData = new FormData();
      const file = files[0];
      formData.append('file', new Blob([file], { type: file.type }), file.name || 'file')

      api.upload("api/files/", formData, function(res){
        console.log(res)

        let coordinates = res.res.split('LINESTRING (')[1].split(')')[0]
        let geometry = "SRID=4326;LINESTRING (" + coordinates + ")";
        coordinates = coordinates.split(",").map(coor => {
          coor = coor.trim().split(" ")
          return [parseFloat(coor[0]), parseFloat(coor[1])]
        })

        let center = [parseFloat(coordinates[0][0]), parseFloat(coordinates[0][1])]
        // self.center = center
        // self.zoom = [15]
        
        let bboxValue = [center[0] - 0.001, center[1] - 0.001, center[0] + 0.001, center[1] + 0.001]

        console.log(coordinates)

        const geojson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {
                "id": 1
              },
              "geometry": {
                "type": "LineString",
                "coordinates": coordinates
              }
            }
          ]
        }

        bboxValue = bbox(geojson)
        // error code
        let layers = <Layer type="line" paint={{
              'line-color': 'green',
              'line-width': 3
            }}>
          <Feature coordinates={coordinates} />
        </Layer>
        
        asset.geom = geometry;
        self.setState({layers: [], asset, bbox: bboxValue})

        setTimeout(() => {
          self.setState({layers: layers})
        }, 2000)
      })
    }
  }

  handlePlace(place) {
    console.log(place, place.geometry.location.lat(), place.geometry.location.lng())
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this

    api.call("api/get-legal/", {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    }, function(res){
      let { asset } = self.state;
      let update = {}

      if (res.data && res.data[0]) {
        asset.county = res.data[3].trim();
        asset.sub_name = res.data[4].trim();
        asset.sub_unit = res.data[5].trim();
        asset.sub_block = res.data[6].trim();

        if (res.data[7].trim() && !asset.geom) {
          asset.geom = `SRID=4326;${res.data[8]}`;
          asset.sub_lot = res.data[7];
          // display point in map
          let coordinates = asset.geom.split('(')[1].split(')')[0].split(' ')
          let color = ASSET_COLORS[res.data[2]] ? ASSET_COLORS[res.data[2]] : '#000000';

          let center = [parseFloat(coordinates[0]), parseFloat(coordinates[1])]

          let bboxValue = [center[0] - 0.001, center[1] - 0.001, center[0] + 0.001, center[1] + 0.001]
          let layers = <Layer type="circle" paint={{
                'circle-color': color
              }}>
            <Feature coordinates={center} />
          </Layer>
          self.setState({layers: [], bbox: bboxValue, asset})
          setTimeout(()=>{
            self.setState({layers: layers})
          }, 2000)
        }

        // self.getCounty()
        // self.loadLegal('county', asset, res.data[3].trim(), 'init')
        // self.loadLegal('level1', asset, res.data[4].trim(), 'init')
        // self.loadLegal('level2', asset, res.data[5].trim(), 'init')
        // self.loadLegal('level3', asset, res.data[6].trim(), 'init')
      }
    })


    let { asset } = this.state;
    asset.situs_street = ""
    if (place?.address_components) {
      let address_components = place?.address_components
      address_components.forEach(item => {
        if (item.types.includes('street_number')) {
          asset.situs_street = item.short_name
        }
        if (item.types.includes("route")) {
          asset.situs_street = asset.situs_street + " " + item.short_name
          asset.situs_street = asset.situs_street.trim()
        }
        if (item.types.includes("locality")) {
          asset.situs_city = item.short_name
        }
        if (item.types.includes("administrative_area_level_1")) {
          asset.situs_state = item.short_name
        }
        if (item.types.includes("postal_code")) {
          asset.situs_zip = item.short_name
        }
      })
      asset.formatted_address = place?.formatted_address
      
      this.setState({asset})
    }
  }

  render() {
    const { asset, tab, comment, saveTooltip, duplication, canPathUpdate, bbox } = this.state;
    const prePage = '';
    const user = storejs.get('user', {});
    const defaultClient = asset.client ? {value: asset.client, label: asset.client} : null;
    const defaultLender = asset.lender ? {value: asset.lender, label: asset.lender} : null;
    const defaultCertifiedBy = asset.certified_by ? {value: asset.certified_by, label: asset.certified_by} : null;
    const defaultMapNo = asset.map_no ? {value: asset.map_no, label: asset.map_no} : null;

    const collectionsForAdmin = Object.keys(this.state.collections).map(key => {
      return {value: key, label: this.state.collections[key]}
    })
    const defaultCollectionForAdmin = asset.collection ? {value: asset.collection, label: this.state.collections[asset.collection]} : null;

    return (
      <React.Fragment>
        <Helmet title="Assets" />

        <EditForm ref="form" onSubmit={(e) => this.props.submitForm()} className="edit-form" onError={errors => console.log(errors)}>
          <Typography variant="h3" gutterBottom display="inline">
            <Grid container spacing={6}>
              <TitleGroup item md={3} mb={6}>
                <Button variant="outlined"
                  style={{ marginTop: '-10px', marginRight: '15px'}}
                  onClick={() => this.props.closeAssetDetail()}>
                    <ArrowLeft />
                </Button> 
                {this.props.assetId == 'new' ? 'Plot Info' : asset.project_no}
              </TitleGroup>
              <Grid item md={5} mb={6}>
              </Grid>
              
            </Grid>
          </Typography>

          <EditSection container spacing={6}>
            <Grid item md={12}>
              <GridContent container>
                <Grid item md={6} xs={12} style={{maxWidth: '48%', flexBasis: '48%', marginRight: '2%', marginTop: '20px'}}>
                  <Grid container>
                    <FilterTitle item md={12} xs={12} style={{'marginTop': '20px'}}>
                      Departed:
                    </FilterTitle>
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>First Name</span>
                        <TextField id="first_name" name="first_name"
                          value={asset.first_name} label=""
                          onChange={(e) => this.handleChange(e, 'first_name')} fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Last Name</span>
                        <TextField id="last_name" name="last_name"
                          value={asset.last_name} label=""
                          onChange={(e) => this.handleChange(e, 'last_name')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Middle</span>
                        <TextField id="middle_name" name="middle_name"
                          value={asset.middle_name} label=""
                          onChange={(e) => this.handleChange(e, 'middle_name')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Suffix</span>
                        <TextField id="suffix" name="suffix"
                          value={asset.suffix} label=""
                          onChange={(e) => this.handleChange(e, 'suffix')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Maiden Name</span>
                        <TextField id="maiden_name" name="maiden_name"
                          value={asset.maiden_name} label=""
                          onChange={(e) => this.handleChange(e, 'maiden_name')} fullWidth />
                      </FormControl>
                    </Grid>                  
                  </Grid>
                </Grid>
                
                <Grid item md={6} xs={12} style={{maxWidth: '49%', flexBasis: '49%', marginTop: '20px'}}>
                  <Grid container>
                    <FilterTitle item md={12} xs={12} style={{'marginTop': '20px'}}>
                      Legal:
                    </FilterTitle>                  
                    <Grid item md={6} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>County</div>
                        <TextField id="county" name="county" value={asset.county} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Addition</div>
                        <TextField id="addition" name="addition" value={asset.addition} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Unit</div>
                        <TextField id="unit" name="unit" value={asset.unit} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Block</div>
                        <TextField id="block" name="block" value={asset.block} label="" fullWidth />
                      </FormControl>
                    </Grid>

                    <Grid item md={6} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Lot</div>
                        <TextField id="lot" name="lot" value={asset.lot} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Plot</div>
                        <TextField id="plot" name="plot" value={asset.plot} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    
                  </Grid>
                </Grid>
                
              </GridContent>
            </Grid>
          </EditSection>

          <Grid container spacing={6} style={{ 'margin-top': '20px', }}>
            <Grid item md={12} style={{ marginTop: '50px', padding: '0px' }}>
              <hr></hr>
            </Grid>
            <Grid item md={6}></Grid>
            <Grid item md={6} mb={6}>
              <TitleAction item md={4} mb={6} xs={12} ml={4} style={{ float: 'right', }}>
                <Button mr={2} color="primary" variant="contained" title="New Plot"
                  onClick={() => { this.submitForm(); }}>
                  Save
                </Button>
                <Button mr={2} color="primary" variant="outlined" title="Clear">
                  Clear
                </Button>
                <Button mr={2} color="primary" variant="outlined" title="Save"
                  onClick={() => this.props.closeAssetDetail()}>
                  Cancel
                </Button>
                
              </TitleAction>
            </Grid>
              
          </Grid>

        </EditForm>

        <Dialog
          open={this.state.streetview}
          onClose={(e)=>this.setState({streetview: false})}
          aria-labelledby="form-dialog-title"
          // style={{maxWidth: '650px'}}
        >
          <DialogTitle id="form-dialog-title">Street View</DialogTitle>
          <DialogContent style={{textAlign: 'center'}}>
            <img src={this.state.streetviewUrl} />
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.setState({streetview: false})} color="primary" variant="outlined" >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar 
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={this.state.notification}
          autoHideDuration={3000}
          onClose={() => this.handleClose()}
          message={this.state.notification_text}
        >
          <Alert severity={this.state.notification_type}>{this.state.notification_text}</Alert>
        </Snackbar>
      </React.Fragment>
    );
  }
}

export default withTheme(AssetDetail);

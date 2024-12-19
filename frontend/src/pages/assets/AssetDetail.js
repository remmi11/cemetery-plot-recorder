import React, { Component } from "react";
import styled, { withTheme } from "styled-components";
import storejs from 'store';

import Helmet from 'react-helmet';
import ReactMapboxGl, {
  Layer, Feature
} from 'react-mapbox-gl';

import {
  Grid,
  TextField,
  Select as MuiSelect,
  Typography as MuiTypography,
  Card as MuiCard,
  CardContent as MuiCardContent,
  FormControl as MuiFormControl,
  Button as MuiButton,
  Snackbar,
} from "@material-ui/core";

import {
  ArrowLeft
} from "react-feather";


import { spacing } from "@material-ui/system";
import { Alert as MuiAlert } from '@material-ui/lab';

import { ValidatorForm } from 'react-material-ui-form-validator';
import ApiInterface from '../../lib/ApiInterface.js';
import * as config from '../../config.js';

import {
  Upload
} from "react-feather";

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

          bboxValue = [center[0] - 0.001, center[1] - 0.001, center[0] + 0.001, center[1] + 0.001]
          
          layers = <Layer type="circle" paint={{
                'circle-color': color
              }}>
            <Feature coordinates={center} />
          </Layer>
        }

        self.setState({asset: res, layers: layers, canPathUpdate: self.checkCollection(res), isRoute: isRoute, bbox: bboxValue});
      })
    } 
    
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
    let { asset, duplication } = this.state;
    const self = this;

    if (type == 'first_name' || type == 'last_name' || type == 'middle_name' || type == 'suffix' || type == 'maiden_name') {
      asset.cemetery_plot[type] = e.target.value;
      this.setState(asset);
    } else { 
        asset[e.target.name] = e.target.value;
        this.setState(asset);
    }

  }

  submitForm = () => {
    let { asset, saveType, duplication } = this.state;
    let { assetId } = this.props;
    let token = storejs.get('token', null);
    let api = new ApiInterface(token.access);
    let self = this;
    let user = storejs.get('user')

    let payload = JSON.parse(JSON.stringify(asset.cemetery_plot))

    if (assetId != 'new') {
      console.log("saving asset form...")

      self.setState({saveTooltip: true});

      api.update(`api/asset/${assetId}/`, payload, function(res){
        self.props.setSelectedAsset(asset.id.toString())
        self.props.closeAssetDetail();

        self.setState({saveTooltip: false});
      });

    } 

  }

  // The function to sumbit the changes of an asset.
  handleSubmit(noLot) {
    
  }

  // // The event function to delete an asset.
  // onAssetDelete(e) {
  //   let { asset } = this.state;
  //   let token = storejs.get('token', null)
  //   let api = new ApiInterface(token.access);
  //   const self = this;

  //   let r = window.confirm("Are you sure you want to delete the selected asset?");

  //   if (r) {
  //     api.delete('api/asseta/' + asset.id + '/', function(res){
  //       self.setState({notification_text: "Asset deleted.", notification: true, notification_type: 'success'});
  //       setTimeout(function(){self.props.history.push('/assets');}, 3000);
  //     });
  //   }
  // }

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

  removeAll(feature) {
    if (this.drawControl) {
      this.drawControl.draw.deleteAll()
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
                Plot Info
              </TitleGroup>
              <Grid item md={5} mb={6}>
              </Grid>              
            </Grid>
          </Typography>

          <EditSection spacing={6}>
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
                          value={asset.cemetery_plot?asset.cemetery_plot.first_name:''} label=""
                          onChange={(e) => this.handleChange(e, 'first_name')} fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Last Name</span>
                        <TextField id="last_name" name="last_name"
                          value={asset.cemetery_plot?asset.cemetery_plot.last_name:''} label=""
                          onChange={(e) => this.handleChange(e, 'last_name')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Middle</span>
                        <TextField id="middle_name" name="middle_name"
                          value={asset.cemetery_plot?asset.cemetery_plot.middle_name:''} label=""
                          onChange={(e) => this.handleChange(e, 'middle_name')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Suffix</span>
                        <TextField id="suffix" name="suffix"
                          value={asset.cemetery_plot?asset.cemetery_plot.suffix:''} label=""
                          onChange={(e) => this.handleChange(e, 'suffix')} fullWidth />
                      </FormControl>
                    </Grid>                  
                    <Grid item md={12} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <span style={{color: 'rgba(0, 0, 0, 0.54)', fontSize: '12px'}}>Maiden Name</span>
                        <TextField id="maiden_name" name="maiden_name"
                          value={asset.cemetery_plot?asset.cemetery_plot.maiden_name:''} label=""
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
                        <TextField disabled id="county" name="county" value={asset.county} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Addition</div>
                        <TextField disabled id="addition" name="addition" value={asset.addition} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Unit</div>
                        <TextField disabled id="unit" name="unit" value={asset.unit} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Block</div>
                        <TextField disabled id="block" name="block" value={asset.block} label="" fullWidth />
                      </FormControl>
                    </Grid>

                    <Grid item md={6} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Lot</div>
                        <TextField disabled id="lot" name="lot" value={asset.lot} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    <Grid item md={1} xs={12}></Grid>
                    <Grid item md={5} xs={12}>
                      <FormControl margin="normal" fullWidth>
                        <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Plot</div>
                        <TextField disabled id="plot" name="plot" value={asset.plot?asset.plot:''} label="" fullWidth />
                      </FormControl>
                    </Grid>
                    
                  </Grid>
                </Grid>
                
              </GridContent>
            </Grid>
          </EditSection>

          <Grid container spacing={6} style={{ 'marginTop': '20px', }}>
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

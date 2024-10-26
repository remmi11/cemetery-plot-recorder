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
    top: 80px;
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

class TicketDetail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ticket: {},
      saveTooltip: false,
      saveType: 'new',
      county: [],

      level1: [],
      level2: [],
      level3: [],
      level4: [],
      projects: [],
      select: null
    }

    this.legals = {'county': [], 'level1': [], 'level2': [], 'level3': [], 'level4': []}
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

    this.joinTypeSelection = {}
    this.wrapperRef = null;
  }

  componentDidMount() {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let { ticketId } = this.props;
    const self = this;

    console.log(ticketId)
    if (ticketId.includes('projectno-')) {
      let asset_id = ticketId.replace('projectno-', '');
      api.call('api/asset/' + asset_id + "/", {}, function(res){
        let ticket = {projectNo: res.project_no}
        if (res.situs_street) {
          ticket['address'] = res.situs_street
        }
        if (res.pid) {
          ticket['accountNo'] = res.pid
        }

        if (res.join_type) {
          self.getCounty(res.join_type)
          ticket['surveyType'] = res.join_type;
          ticket['county'] = res.county;
          res['surveyType'] = res.join_type;
          self.loadLegal('county', res, res.county, 'init')

          if (res.join_type == 'residential') {
            if (res.sub_name) {
              self.loadLegal('level1', res, res.sub_name, 'init')
              ticket['subdivision'] = res.sub_name
            }
            if (res.sub_unit) {
              self.loadLegal('level2', res, res.sub_unit, 'init')
              ticket['unit'] = res.sub_unit
            }
            if (res.sub_block) {
              self.loadLegal('level3', res, res.sub_block, 'init')
              ticket['block'] = res.sub_block
            }
          } else if (res.join_type == 'rural') {
            if (res.rural_survey) {
              self.loadLegal('level1', res, res.rural_survey, 'init')
              ticket['subdivision'] = res.rural_survey
            }
            if (res.rural_block) {
              self.loadLegal('level2', res, res.rural_block, 'init')
              ticket['unit'] = res.rural_block
            }
          } else {
            if (res.plss_meridian) {
              self.loadLegal('level1', res, res.plss_meridian, 'init')
              ticket['subdivision'] = res.plss_meridian
            }
            if (res.plss_t_r) {
              self.loadLegal('level2', res, res.plss_t_r, 'init')
              ticket['unit'] = res.plss_t_r
            }
          }
        }

        console.log(ticket)
        self.setState({ticket});
      })
    } else if (ticketId != 'new' || !ticketId.includes('projectno-')) {
      api.call('api/ticket/' + ticketId + "/", {}, function(res){
        if (res.join_type) {
          self.getCounty(res.join_type)

          if (res.join_type == 'residential') {
            self.loadLegal('county', res, res.county, 'init')
            self.loadLegal('level1', res, res.sub_name, 'init')
            self.loadLegal('level2', res, res.sub_unit, 'init')
            self.loadLegal('level3', res, res.sub_block, 'init')
          } else if (res.join_type == 'rural') {
            self.loadLegal('county', res, res.county, 'init')
            self.loadLegal('level1', res, res.rural_survey, 'init')
            self.loadLegal('level2', res, res.rural_block, 'init')
          } else {
            self.loadLegal('county', res, res.county, 'init')
            self.loadLegal('level1', res, res.plss_meridian, 'init')
            self.loadLegal('level2', res, res.plss_t_r, 'init')
          }
        }
        self.setState({ticket: res});
      })
    }

    var elements = document.getElementsByClassName("MuiInput-input");
    for (var i = 0, len = elements.length; i < len; i++) {
      elements[i].autocomplete = "off"
      elements[i].autocorrect = "off"
      elements[i]["aria-autocomplete"] = "off"
    }
    document.addEventListener('mouseup', (e) => {
      if (self.wrapperRef && !self.wrapperRef.contains(e.target)) {
        if (self.state.select == "project") {
          let ticket = self.state.ticket
          ticket.projectNo = ""
          self.setState({select: "",  saveTooltip: false, ticket})
          return;
        }
        self.setState({select: "",  saveTooltip: false})
      }
    });
  }

  componentDidUpdate() {
    var elements = document.getElementsByClassName("MuiInput-input");
    for (var i = 0, len = elements.length; i < len; i++) {
      elements[i].autocomplete = "off"
      elements[i].autocorrect = "off"
      elements[i]["aria-autocomplete"] = "off"
    }
  }

  getCounty(join_type) {
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;
    api.call('api/ajax_load_counties/', {join_type: join_type}, function(res){
      self.setState({county: res})
      self.legals.county = res;
    })
  }

  handleChange(e, type) {
    let { ticket } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    if (['join_type', 'county', 'level1', 'level2', 'level3', 'level4'].includes(type)) {
      let state = {select: type}
      if (type != 'level4') {
        self.loadLegal(type, e)
      } else {
        ticket[e.target.name] = e.target.value;
        this.setState(ticket)
      }
      if (type != 'join_type') {
        let temp = this.legals[type].filter(l => l && l.toLowerCase().includes(e.target.value.toLowerCase()))
        state[type] = temp
      }
      this.setState(state)
    } else if (type == 'project') {
      if (e.target.value && e.target.value.length > 2) {
        api.call('api/ajax_data/', {type: 'project_no', project_no: e.target.value}, function(res){
          self.setState({projects: res})
        })
      }
      ticket[e.target.name] = e.target.value;
      this.setState({ticket, select: 'project', projects: []});
    } else if (e.target.name == 'status') {
      ticket[e.target.name] = e.target.checked ? 'CLOSED' : 'OPEN'
      this.setState(ticket);
    } else {
      ticket[e.target.name] = e.target.value;
      this.setState(ticket);
    }
  }

  onSelect(e, name, value, type) {
    let { ticket } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let temp = {target: {value: value, name: name}}

    if (type != 'project') {
      self.loadLegal(type, temp)
    }

    let state = {select: ""}
    state[type] = value
    this.setState(state)
  }

  loadLegal(type, e, value, init) {
    let { ticket } = this.state;

    if (init) {
      ticket = e;
    }

    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let payload = {
      join_type: ticket.surveyType
    }
    let url = "api/ajax_load_data/"
    const self = this;

    if (type == 'join_type') {
      this.getCounty(e.target.value)

      ticket.county = ""
      ticket.subdivision = ""
      ticket.unit = ""
      ticket.block = ""
      ticket.lot = ""
      this.joinTypeSelection = {}

      if (!init) {
        ticket[e.target.name] = e.target.value;
        this.setState({ticket: ticket})
      }
      return;
    } else if (type == 'county') {
      if (!init) {
        ticket.subdivision = ""
        ticket.unit = ""
        ticket.block = ""
        ticket.lot = ""
      }

      payload['county'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][ticket.surveyType]
      this.joinTypeSelection = {}
      api.create(url, payload, function(res){
        self.setState({level1: res})
        self.legals['level1'] = res;
      })
    } else if (type == 'level1') {
      if (!init) {
        ticket.unit = ""
        ticket.block = ""
        ticket.lot = ""
      }

      payload['county'] = ticket.county
      payload['level1'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][ticket.surveyType]
      this.joinTypeSelection['level1'] = init ? value : e.target.value

      api.create(url, payload, function(res){
        self.setState({level2: res})
        self.legals['level2'] = res;
      })
    } else if (type == 'level2') {
      if (!init) {
        ticket.block = ""
        ticket.lot = ""
      }
      payload['county'] = ticket.county
      payload['level1'] = this.joinTypeSelection['level1']
      payload['level2'] = init ? value : e.target.value
      this.joinTypeSelection['level2'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][ticket.surveyType]
      api.create(url, payload, function(res){
        self.setState({level3: res})
        self.legals['level3'] = res;
      })
    } else if (type == 'level3') {
      if (!init) {
        ticket.lot = ""
      }
      payload['county'] = ticket.county
      payload['level1'] = this.joinTypeSelection['level1']
      payload['level2'] = this.joinTypeSelection['level2']
      payload['level3'] = init ? value : e.target.value
      this.joinTypeSelection['level3'] = init ? value : e.target.value
      payload['type'] = this.join_types[type][ticket.surveyType]

      if (payload['type']) {
        api.create(url, payload, function(res){
          self.setState({level4: res})
          self.legals['level4'] = res;
        })
      }
    }

    if (!init) {
      ticket[e.target.name] = e.target.value;
      this.setState({ticket: ticket})
    }
  }

  // The function to sumbit the changes of an asset.
  handleSubmit() {
    let { ticket, saveType } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;
    let user = storejs.get('user')
    let { ticketId } = this.props

    ticket['author'] = user.id
    ticket['last_edited'] = ticket['author']

    console.log(ticket)
    let payload = JSON.parse(JSON.stringify(ticket))
    if (ticketId != 'new' && !ticketId.includes('projectno-')) {
      ticket['last_edited'] = ticket['author']
      delete ticket['author']
      payload = JSON.parse(JSON.stringify(ticket))
      api.update('api/ticket/' + ticket.id.toString() + "/", payload, function(res){
        if (saveType == 'save') {
          self.props.setTicket(ticket.id.toString());
        } else if (saveType == 'new') {
          self.props.closeAndNewTicket();
        } else {
          self.props.closeTicketDetail();
        }
        self.props.onReload();
      })
    } else {
      api.create('api/ticket_create/', payload, function(res){
        if (!res.id) {
          return;
        }
        if (saveType == 'save') {
          self.props.setTicket(res.id.toString());
        } else if (saveType == 'new') {
          self.props.closeAndNewTicket();
        } else {
          self.props.closeTicketDetail();
        }

        self.props.onReload();
        api.call('api/ticket/' + res.id.toString() + "/", {}, function(res){
          self.setState({ticket: res})
        })
      })
    }
    self.setState({saveTooltip: false})
  }

  delete(id) {
    let { filter } = this.state;
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    const self = this;

    let r = window.confirm("Are you sure you want to remove this ticket?");

    if (r) {
      api.delete('api/ticket/' + id + '/', function(remove){
        self.props.closeTicketDetail();
        self.props.onReload();
      })
    }
  }

  render() {
    const {ticket, saveType,  saveTooltip, select} = this.state;
    const { ticketId } = this.props;

    let status = ticket.status == 'CLOSED' ? true : false
    return (
      <React.Fragment>
        <Helmet title="Tickets" />

        <EditForm ref="form" onSubmit={(e) => this.handleSubmit(e)} className="edit-form" onError={errors => console.log(errors)}>
          <Typography variant="h3" gutterBottom display="inline">
          <Grid container spacing={6}>
            <TitleGroup item md={3} mb={6}>
              <Button variant="outlined"
                style={{ marginTop: '-10px', marginRight: '15px'}}
                onClick={() => this.props.closeTicketDetail()}>
                <ArrowLeft />
               </Button>
              {ticketId == 'new' ? 'New Ticket' : ticket.projectNo}</TitleGroup>
            <Grid item md={5} mb={6}>
            </Grid>
            <TitleAction item md={4} mb={6} xs={12}>
              <Button mr={2} color="primary" variant="outlined" onClick={(e) => this.setState({saveTooltip: !saveTooltip})} title="Save">
                <SaveIcon />
              </Button>
              {saveTooltip && <div className="save-tooltip" ref={(obj) => this.wrapperRef = obj}>
                <button className="item" type="submit" onClick={(e) => this.setState({saveType: 'save'})}>
                  Save
                </button>
                <button div className="item" type="submit" onClick={(e) => this.setState({saveType: 'new'})}>
                  Save and New
                </button>
                <button className="item" type="submit" onClick={(e) => this.setState({saveType: 'close'})}>
                  Save and Close
                </button>
              </div>}
              <Button mr={2} color="primary" variant="outlined" title="Delete" onClick={(e) => this.delete(ticketId)}>
                <DeleteForever />
              </Button>
            </TitleAction>
          </Grid>
        </Typography>
        <EditSection container spacing={6}>
          <Grid item md={12}>
            <GridContent container>
              <Grid item md={6} xs={12} style={{maxWidth: '46%', flexBasis: '46%', marginRight: '4%', marginTop: '40px'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    Project Info:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator id="subject" name="subject"
                        value={ticket.subject || ""} label="Subject *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="address" name="address"
                        value={ticket.address || ""} label="Address"
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                    <FormControl margin="normal" fullWidth>
                      <TextField id="accountNo" name="accountNo"
                        value={ticket.accountNo || ""} label="PID"
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator id="projectNo" name="projectNo"
                        value={ticket.projectNo || ""} label="Project Number *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'project')} fullWidth />
                      {select == 'project' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.projects && this.state.projects.map(county => {
                          return <div className="auto-item" onClick={(e) => this.onSelect(e, 'projectNo', county, 'projectNo')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>
                  <FilterTitle item md={12} xs={12} style={{marginTop: '50px'}}>
                    Legals:
                  </FilterTitle>
                  <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <div className="control-title" style={{color: 'gray', fontSize: '12px'}}>Survey Type *</div>
                      <SelectValidator id="surveyType"
                      validators={['required', ]} errorMessages={['this field is required', ]}
                      value={ticket.surveyType || ""}
                      name="surveyType" onChange={(e) => this.handleChange(e, 'join_type')} fullWidth>
                        <MenuItem value="residential">Residential</MenuItem>
                        <MenuItem value="rural">Rural</MenuItem>
                        <MenuItem value="plss">Plss</MenuItem>
                        <MenuItem value="other">Other Issue</MenuItem>
                      </SelectValidator>
                    </FormControl>
                  </Grid>
                  <Grid item md={1} xs={12}></Grid>
                  {ticket.surveyType && ticket.surveyType != 'other' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator id="county" name="county"
                        value={ticket.county || ""} label="County *"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'county')} fullWidth />
                      {select == 'county' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.county && this.state.county.map(county => {
                          return <div className="auto-item" onClick={(e) => this.onSelect(e, 'county', county, 'county')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'plss' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="subdivision"
                        value={ticket.subdivision || ""} label="Meridian"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level1')} fullWidth />
                      {select == 'level1' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level1.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'subdivision', county, 'level1')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'plss' && <Grid item md={1} xs={12}></Grid>}
                  {ticket.surveyType == 'plss' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="unit"
                        value={ticket.unit || ""} label="Township Range"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level2')} fullWidth />
                      {select == 'level2' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level2.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'unit', county, 'level2')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'plss' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth style={{    marginBottom: '100px'}}>
                      <TextValidator name="block"
                        value={ticket.block || ""} label="Section"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level3')} fullWidth />
                      {select == 'level3' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level3.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'block', county, 'level3')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="subdivision"
                        value={ticket.subdivision || ""} label="Subdivision"
                        onChange={(e) => this.handleChange(e, 'level1')} fullWidth />
                      {select == 'level1' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level1.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'subdivision', county, 'level1')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={1} xs={12}></Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="unit"
                        value={ticket.unit || ""} label="Unit"
                        onChange={(e) => this.handleChange(e, 'level2')} fullWidth />
                      {select == 'level2' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level2.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'unit', county, 'level2')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth style={{    marginBottom: '100px'}}>
                      <TextValidator name="block"
                        value={ticket.block || ""} label="Sub Block"
                        onChange={(e) => this.handleChange(e, 'level3')} fullWidth />
                      {select == 'level3' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level3.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'block', county, 'level3')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={1} xs={12}></Grid>}
                  {ticket.surveyType == 'residential' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth style={{    marginBottom: '100px'}}>
                      <TextValidator name="lot"
                        value={ticket.lot || ""} label="Lot"
                        onChange={(e) => this.handleChange(e, 'level4')} fullWidth />
                      {select == 'level4' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level4.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'lot', county, 'level4')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}

                  {ticket.surveyType == 'rural' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="subdivision"
                        value={ticket.subdivision || ""} label="Survey"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level1')} fullWidth />
                      {select == 'level1' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level1.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'subdivision', county, 'level1')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'rural' && <Grid item md={1} xs={12}></Grid>}
                  {ticket.surveyType == 'rural' && <Grid item md={6} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextValidator name="unit"
                        value={ticket.unit || ""} label="Block"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level2')} fullWidth />
                      {select == 'level2' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level2.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'unit', county, 'level2')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                  {ticket.surveyType == 'rural' && <Grid item md={5} xs={12}>
                    <FormControl margin="normal" fullWidth style={{    marginBottom: '100px'}}>
                      <TextValidator name="block"
                        value={ticket.block || ""} label="Section"
                        validators={['required', ]}
                        errorMessages={['This field is required', ]}
                        onChange={(e) => this.handleChange(e, 'level3')} fullWidth />
                      {select == 'level3' && <div ref={(obj) => this.wrapperRef = obj} className="auto-panel">
                        {this.state.level3.map(county => {
                          return <div className="auto-item" value={county} onClick={(e) => this.onSelect(e, 'block', county, 'level3')}>{county}</div>
                        })}
                      </div>}
                    </FormControl>
                  </Grid>}
                </Grid>
              </Grid>
              <Grid item md={6} xs={12} style={{maxWidth: '46%', flexBasis: '46%', marginLeft: '4%', marginTop: '40px'}}>
                <Grid container>
                  <FilterTitle item md={12} xs={12}>
                    Notes:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextareaAutosize id="notes" name="notes" rows={5}
                        value={ticket.notes || ""} label=""
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid container style={{'marginTop': '50px'}}>
                  <FilterTitle item md={12} xs={12}>
                    Response:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <TextareaAutosize id="response" name="response" rows={5}
                        value={ticket.response || ""} label=""
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid container style={{'marginTop': '50px'}}>
                  <FilterTitle item md={12} xs={12}>
                    Closed:
                  </FilterTitle>
                  <Grid item md={12} xs={12}>
                    <FormControl margin="normal" fullWidth>
                      <Checkbox type="checkbox" id="status" name="status"
                        checked={status}
                        onChange={(e) => this.handleChange(e)} fullWidth />
                    </FormControl>
                  </Grid>
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

export default withTheme(TicketDetail);

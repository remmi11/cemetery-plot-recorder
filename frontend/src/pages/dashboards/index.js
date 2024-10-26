import React, {Component} from "react";
import styled, { withTheme } from "styled-components";

import Helmet from 'react-helmet';

import {
  Grid,
  Divider as MuiDivider,
  Card,
  CardContent as MuiCardContent,
  CircularProgress as MuiCircularProgress,
  Typography as MuiTypography
} from "@material-ui/core";

import { green, red } from "@material-ui/core/colors";

import { spacing } from "@material-ui/system";

import ApiInterface from '../../lib/ApiInterface.js';
import Stats from './Stats.js';
import PieChart from './DoughnutChart.js'
import LineChart from './LineChart.js'
import storejs from 'store';

const Divider = styled(MuiDivider)(spacing);

const Typography = styled(MuiTypography)(spacing);
const CircularProgress = styled(MuiCircularProgress)(spacing);

const DashboardWrapper = styled(Grid)`
  padding: 30px 50px;
  background: rgb(247, 249, 252);
  .shrink {
    padding: 4px 12px !important;
    .MuiGrid-item {
      padding: 4.7px 13px !important;
    }
    .MuiTypography-subtitle1 {
      font-size: 14px !important;
    }
  }

  .MuiCard-root {
    box-shadow: 0px 0px 5px 1px #c1c1c1;
  }

  .stats-content {
    min-height: 290px;
  }
  .stats-summary .MuiGrid-item {
    padding: 8px;
  }
  .collection-item {
    padding: 21px;

    .MuiGrid-grid-md-4 {
      padding: 4px;
    }
  }

  .stats-panel {
    height: 290px !important;
    overflow-y: auto;
  }
`;

const CardContent = styled(MuiCardContent)`
  position: relative;

  &:last-child {
    padding-bottom: ${props => props.theme.spacing(4)}px;
  }

  .title {
    font-weight: bold;
    font-size: 14px;
  }
  .content {
    margin-top: 10px;
  }
`;

class Analytics extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assets: [],
      join_type: [],
      loading: true,
      total: 0,
      unmapped_total: 0,
      recent_total: 0,
      recent: {}
    }
  }

  componentDidMount(){
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;

    api.call('api/dashboard/', {}, function(res){
      console.log(res)
      let total = 0
      res.collection.forEach(item => {
        total += item.count;
      })
      let recent_total = res.recent.year + res.recent.month + res.recent.week
      self.setState({loading: false, assets: res.collection, total, join_type: res.join_type, recent_total, recent: res.recent, unmapped_total: res.unmapped})
    })
  }

  formatValue(cost) {
    if (!isNaN(cost)) {
      cost = parseFloat(cost).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,').split(".")[0]
    }
    return cost;
  }

  formatCurrency(cost) {
    if (!isNaN(cost)) {
      cost = parseFloat(cost).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
    }
    return cost;
  }

  render() {
    let {assets, total, loading, join_type, recent_total, recent, unmapped_total} = this.state
    let data = [{
      name: 'Residential',
      value: '28,231'
    }, {
      name: 'Rural',
      value: '28,231'
    }, {
      name: 'PLSS',
      value: '28,231'
    }, ]
    return (
      <React.Fragment>
        <Helmet title="Analytics Dashboard" />
        <DashboardWrapper className="dashboard">
          { loading && <CircularProgress m={2} style={{width: '50px',
            height: '50px',
            position: 'absolute',
            left: '50%',
            top: '50%',
            zIndex: '10'}}/>}

          <Grid container spacing={6}>
            <Grid item xs={12} lg={3}>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={12} md={12}>
                  <Card>
                    <CardContent className="stats-content stats-summary">
                      <Grid item xs={12} sm={12} md={12} className="title">
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={6}>
                            All Assets:
                          </Grid>
                          <Grid item xs={12} sm={12} md={6} style={{textAlign: 'right'}}>
                            {total == 0 ? '-' : total}
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} sm={12} md={12} className="content">
                        {assets.map(item => {
                          return <Grid container spacing={6}>
                            <Grid item xs={12} sm={12} md={8}>
                              {item.collection}:
                            </Grid>
                            <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                              {item.count}
                            </Grid>
                          </Grid>
                        })}
                        {unmapped_total != 0 && <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Unmapped:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {unmapped_total}
                          </Grid>
                        </Grid>}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={3}>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={12} md={12}>
                  <Card>
                    <CardContent className="stats-content">
                      <Grid item xs={12} sm={12} md={12} className="title">
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Recent Activity:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} sm={12} md={12} className="content" style={{marginBottom: '20px'}}>
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this week:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.week == null ? '-' : recent.week}
                          </Grid>
                        </Grid>
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this month:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.month == null ? '-' : recent.month}
                          </Grid>
                        </Grid>
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this year:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.year == null ? '-' : recent.year}
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} sm={12} md={12} className="title">
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Furman Recent Activity:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid item xs={12} sm={12} md={12} className="content">
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this week:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.furman_week == null ? '-' : recent.furman_week}
                          </Grid>
                        </Grid>
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this month:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.furman_month == null ? '-' : recent.furman_month}
                          </Grid>
                        </Grid>
                        <Grid container spacing={6}>
                          <Grid item xs={12} sm={12} md={8}>
                            Assets this year:
                          </Grid>
                          <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                            {recent.furman_year == null ? '-' : recent.furman_year}
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={6} className="collection-item">
              <Grid container spacing={6} className="stats-panel">
                {assets.map(item => {
                  return <Grid item xs={12} sm={12} md={4}>
                    <Stats title={item.collection} value={item.count} unmapped={item.unmapped} data={item.types} />
                  </Grid>
                })}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
                {loading && <Grid item xs={12} sm={12} md={4}>
                  <Stats title="" />
                </Grid>}
              </Grid>
            </Grid>
            <Grid item xs={12} lg={8}>
              <LineChart />
            </Grid>
            <Grid item xs={12} lg={4}>
              <PieChart join_type={join_type} />
            </Grid>
          </Grid>
        </DashboardWrapper>
      </React.Fragment>
    );
  }
}

export default withTheme(Analytics);

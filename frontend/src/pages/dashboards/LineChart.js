import React, { Component } from "react";
import styled, { withTheme } from "styled-components";

import {
  Card as MuiCard,
  CardContent,
  CardHeader,
  Menu,
  MenuItem,
  IconButton
} from "@material-ui/core";

import { spacing } from "@material-ui/system";

import { fade } from "@material-ui/core/styles/colorManipulator";

import { Line } from "react-chartjs-2";

import { MoreVertical, ChevronDown } from "react-feather";
import { blue, green, red, orange } from "@material-ui/core/colors";
import ApiInterface from '../../lib/ApiInterface.js';
import storejs from 'store';

const Card = styled(MuiCard)(spacing);

const ChartWrapper = styled.div`
  height: 278px;
`;

const CardHeaderWrapper = styled(CardHeader)`
  button {
    width: 120px !important;
  }
  .filter-label {
    font-size: 12px;
  }
`;

class LineChart extends Component {
  state = {
    anchorEl: null,
    range: 12,
    chartData: {}
  };
  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = (months) => {
    let { chartData } = this.state;
    chartData.labels = [...this.labels].slice(12-months, 12)
    chartData.datasets[0].data = [...this.series.rural].slice(12-months, 12)
    chartData.datasets[1].data = [...this.series.residential].slice(12-months, 12)
    chartData.datasets[2].data = [...this.series.plss].slice(12-months, 12)
    chartData.datasets[3].data = [...this.series.route].slice(12-months, 12)

    this.setState({ anchorEl: null, range: months, chartData });
  };
  constructor() {
    super();

    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    let self = this;

    this.series = {}
    this.labels = {}

    api.create('api/dashboard/', {}, function(res){
      console.log(res)
      self.series = JSON.parse(JSON.stringify(res.data))
      self.labels = res.labels
      let chartData = {
        labels: res.labels,
        datasets: [
          {
            label: "Residential",
            fill: true,
            backgroundColor: "transparent",
            borderColor: blue[500],
            data: res.data.residential
          },
          {
            label: "Rural",
            fill: true,
            backgroundColor: "transparent",
            borderColor: red[500],
            data: res.data.rural
          },
          {
            label: "PLSS",
            fill: true,
            backgroundColor: "transparent",
            borderColor: orange[500],
            data: res.data.plss
          },
          {
            label: "Route",
            fill: true,
            backgroundColor: "transparent",
            borderColor: green[500],
            data: res.data.route
          }
        ]
      };

      self.setState({chartData})
    })

    this.options = {
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      plugins: {
        filler: {
          propagate: false
        }
      },
      scales: {
        xAxes: [
          {
            reverse: true,
            gridLines: {
              color: "rgba(0,0,0,0.0)"
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              stepSize: 500
            },
            display: true,
            borderDash: [5, 5],
            gridLines: {
              color: "rgba(0,0,0,0.0375)",
              fontColor: "#fff"
            }
          }
        ]
      }
    };
  }

  render() {
    const { anchorEl, range, chartData } = this.state;
    return (
      <Card mb={3}>
        <CardHeaderWrapper
          action={
            <>
              <IconButton aria-label="settings" onClick={this.handleClick}>
                <span className="filter-label">Last {range} Months</span> <ChevronDown />
              </IconButton>
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleClose}
              >
                <MenuItem onClick={(e) => this.handleClose(3)}>Last 3 Months</MenuItem>
                <MenuItem onClick={(e) => this.handleClose(6)}>Last 6 Months</MenuItem>
                <MenuItem onClick={(e) => this.handleClose(12)}>Last 12 Months</MenuItem>
              </Menu>
            </>
          }
          title="Monthly Performance"
        />
        <CardContent>
          <ChartWrapper>
            <Line data={chartData} options={this.options} />
          </ChartWrapper>
        </CardContent>
      </Card>
    );
  }
}

export default withTheme(LineChart);

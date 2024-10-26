import React from "react";
import styled, { withTheme } from "styled-components";

import { blue, green, red, orange } from "@material-ui/core/colors";

import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader,
  IconButton,
  Table,
  TableBody,
  TableCell as MuiTableCell,
  TableHead,
  TableRow as MuiTableRow,
  Typography
} from "@material-ui/core";

import { spacing } from "@material-ui/system";

import { Doughnut } from "react-chartjs-2";

import { MoreVertical } from "react-feather";

const Card = styled(MuiCard)(spacing);

const CardContent = styled(MuiCardContent)`
  &:last-child {
    padding-bottom: ${props => props.theme.spacing(2)}px;
  }
  min-height: 318px;

  .stats-icon {
    width: 14px;
    height: 14px;
    margin: -1px 7px 0px 0px;
    display: inline-block;
  }

  .icon-rural {
    background: ${red[500]}
  }
  .icon-residential {
    background: ${blue[500]}
  }
  .icon-plss {
    background: ${orange[500]}
  }
  .icon-route {
    background: ${green[500]}
  }
`;

const ChartWrapper = styled.div`
  height: 168px;
  position: relative;
`;

const DoughnutInner = styled.div`
  width: 100%;
  position: absolute;
  top: 50%;
  left: 0;
  margin-top: -22px;
  text-align: center;
  z-index: 0;
`;

const TableRow = styled(MuiTableRow)`
  height: 42px;

  &:last-child th,
  &:last-child td {
    border-bottom: 0;
  }
`;

const TableCell = styled(MuiTableCell)`
  padding-top: 0;
  padding-bottom: 0;
`;

const MAPPING = {
  'residential': 'Residential',
  'plss': 'PLSS',
  'rural': 'Rural',
  'route': 'Route'
}

const MAPPING1 = {
  'residential': 0,
  'plss': 2,
  'rural': 1,
  'route': 3
}

const PieChart = ({ join_type }) => {
  let chartData = [];
  join_type.forEach(item => {
    if (item.join_type) {
      chartData.push([MAPPING1[item.join_type], MAPPING[item.join_type], item.count, item.join_type])
    }
  })
  chartData = chartData.sort((a, b) => a[0] > b[0] ? 1 : -1);
  const data = {
    labels: ["Residential", "Rural", "PLSS", "Route"],
    datasets: [
      {
        data: chartData.map(ch => ch[2]),
        backgroundColor: [
          blue[500],
          red[500],
          orange[500],
          green[500],
        ],
        borderWidth: 5
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    cutoutPercentage: 80
  };

  return (
    <Card mb={3}>
      <CardHeader
        action={
          <IconButton aria-label="settings">
            <MoreVertical />
          </IconButton>
        }
        title="Projects Breakdown by Survey Type"
      />

      <CardContent>
        <ChartWrapper>
          <DoughnutInner variant="h4">
          </DoughnutInner>
          <Doughnut data={data} options={options} />
        </ChartWrapper>
        <Table>
          <TableBody>
            {chartData && chartData.map(dt => {
              return <TableRow>
                <TableCell component="th" scope="row">
                  <span class={`stats-icon icon-${dt[3]}`}></span>{dt[1]}
                </TableCell>
                <TableCell align="right">{dt[2]}</TableCell>
              </TableRow>
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default withTheme(PieChart);

import React from "react";
import styled from "styled-components";

import {
  Box,
  Grid,
  Card,
  CardContent as MuiCardContent,
  Chip as MuiChip,
  Typography as MuiTypography
} from "@material-ui/core";

import { spacing } from "@material-ui/system";

const Typography = styled(MuiTypography)(spacing);

const CardContent = styled(MuiCardContent)`
  position: relative;
  min-height: 117px;

  &:last-child {
    padding-bottom: ${props => props.theme.spacing(4)}px;
  }

  .title {
    font-weight: bold;
    font-size: 14px;
  }
  .content {
    margin-top: 5px;
  }

  .MuiGrid-item {
    padding: 6px !important;
  }

  .s-title {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`;

const Percentage = styled(MuiTypography)`
  color: ${props => props.theme.palette.grey[600]};

  span {
    color: ${props => props.percentagecolor};
    padding-right: 10px;
    font-weight: ${props => props.theme.typography.fontWeightBold};
  }
`;

const MAPPING = {
  'residential': 'Residential',
  'plss': 'PLSS',
  'rural': 'Rural',
  'route': 'Route'
}

function Stats({ title, value, unmapped, data }) {
  return (
    <Card>
      {title == '' && <CardContent></CardContent>}
      {title != '' && <CardContent>
        <Grid item xs={12} sm={12} md={12} className="title">
          <Grid container spacing={6}>
            <Grid item xs={12} sm={12} md={8} className="s-title">
              {title}:
            </Grid>
            <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
              {value}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} sm={12} md={12} className="content">
          {data.map(dt => {
            return <Grid container spacing={6}>
              <Grid item xs={12} sm={12} md={8}>
                {MAPPING[dt.join_type] ? MAPPING[dt.join_type] : 'Unknown'}:
              </Grid>
              <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
                {dt.count}
              </Grid>
            </Grid>
          })}
          {unmapped != 0 && <Grid container spacing={6}>
            <Grid item xs={12} sm={12} md={8}>
              Unmapped:
            </Grid>
            <Grid item xs={12} sm={12} md={4} style={{textAlign: 'right'}}>
              {unmapped}
            </Grid>
          </Grid>}
        </Grid>
      </CardContent>}
    </Card>
  );
}

export default Stats;

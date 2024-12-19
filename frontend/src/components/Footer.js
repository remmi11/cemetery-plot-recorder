import React, { Component } from "react";
import styled from "styled-components";

import {
  Grid,
  Hidden,
  List,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  ListItem as MuiListItem
} from "@material-ui/core";

const Wrapper = styled.div`
  padding: ${props => props.theme.spacing(1) / 4}px
    ${props => props.theme.spacing(4)}px;
  background: ${props => props.theme.palette.common.white};
  position: relative;

  .MuiListItem-root {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
  }
`;

const ListItem = styled(MuiListItem)`
  display: inline-block;
  width: auto;
  padding-left: ${props => props.theme.spacing(2)}px;
  padding-right: ${props => props.theme.spacing(2)}px;

  &,
  &:hover,
  &:active {
    color: #000;
  }
`;

class Footer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      support: false,
      privacy: false
    }
  }

  render () {
    return (
      <Wrapper>
        <Grid container spacing={0}>
          <Hidden smDown>
            <Grid container item xs={12} md={6}>
              <List>
                <ListItem component="a" href="#" onClick={() => this.setState({support: true})}>
                  <ListItemText primary="Support" />
                </ListItem>
                <ListItem component="a" href="#" onClick={() => this.setState({privacy: true})}>
                  <ListItemText primary="Privacy" />
                </ListItem>
              </List>
            </Grid>
          </Hidden>
          <Grid container item xs={12} md={6} justify="flex-end">
            <List>
              <ListItem>
                <ListItemText primary={`v0.2 - Cemetery Plot Recorder`} />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        <Dialog
          open={this.state.support}
          onClose={(e)=>this.setState({support: false})}
          aria-labelledby="form-dialog-title"
          fullWidth={true}
        >
          <DialogTitle id="form-dialog-title">Support</DialogTitle>
          <DialogContent>
              For support contact us
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.setState({support: false})} color="primary" variant="outlined" >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={this.state.privacy}
          onClose={(e)=>this.setState({privacy: false})}
          aria-labelledby="form-dialog-title"
          fullWidth={true}
        >
          <DialogTitle id="form-dialog-title"></DialogTitle>
          <DialogContent>
          </DialogContent>
          <DialogActions>
            <Button onClick={(e)=>this.setState({privacy: false})} color="primary" variant="outlined" >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Wrapper>
    );
  }
}

export default Footer;

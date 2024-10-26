import React, { useState, Component } from "react";
import styled, { withTheme } from "styled-components";
import { connect } from "react-redux";
import storejs from 'store';
import { NavLink as RouterNavLink } from "react-router-dom";

import {
  Grid,
  Hidden,
  Menu,
  MenuItem,
  Link,
  AppBar as MuiAppBar,
  IconButton as MuiIconButton,
  Typography as MuiTypography,
  Toolbar
} from "@material-ui/core";

import { Menu as MenuIcon } from "@material-ui/icons";
import { setAuth } from '../redux/actions/authActions.js';
import { spacing } from "@material-ui/system";

import {
  Power
} from "react-feather";

const AppBar = styled(MuiAppBar)`
  background: #09539c;
  color: white;
  box-shadow: ${props => props.theme.shadows[1]};
`;

const IconButton = styled(MuiIconButton)`
  svg {
    width: 22px;
    height: 22px;
  }
`;

const Typography = styled(MuiTypography)(spacing);
const NavLink = React.forwardRef((props, ref) => (
  <RouterNavLink innerRef={ref} {...props} />
));

function UserMenu({logout}) {
  const [anchorMenu, setAnchorMenu] = useState(null);

  const toggleMenu = event => {
    setAnchorMenu(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorMenu(null);
  }

  const signOut = () => {
    logout()
    setAnchorMenu(null);
  };

  return (
    <React.Fragment>
      <IconButton
        aria-owns={Boolean(anchorMenu) ? "menu-appbar" : undefined}
        aria-haspopup="true"
        onClick={toggleMenu}
        color="inherit"
      >
        <Power />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorMenu}
        open={Boolean(anchorMenu)}
        onClose={closeMenu}
      >
        <MenuItem>
          <Link component={NavLink} exact to={`/users/detail/${storejs.get('user').id}`} style={{ color: 'inherit', textDecoration: 'none'}}>
            Profile
          </Link>
        </MenuItem>
        <MenuItem onClick={signOut}>
          Sign out
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
}

class Header extends Component {
  logout() {
    storejs.set('token', null);
    storejs.set('user', null);
    window.location.href = "/";
  }

  componentWillMount() {
    if (storejs.get('token', null) == null) {
      window.location.href = "/";
    }
  }

  redirect() {
    storejs.set('bounds', [-108.17760745441063,33.234930914675445,-94.99167812063787,36.67397646539162])
    window.location.href = '/assets';
  };

  render() {
    let title = "";
    if (window.location.href.includes('assets')) {
      title = "Assets";
    } else if (window.location.href.includes('dashboard')) {
      title = "Dashboard";
    } else if (window.location.href.includes('inspections')) {
      title = "Inspections";
    }

    return (
      <React.Fragment>
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <Grid container alignItems="center">
              <Hidden mdUp>
                <Grid item>
                  <IconButton
                    color="inherit"
                    aria-label="Open drawer"
                    onClick={this.props.onDrawerToggle}
                  >
                    <MenuIcon />
                  </IconButton>
                </Grid>
              </Hidden>
              <Typography variant="h3" display="inline">
                <a href="javascript:void(0)" onClick={(e) => this.redirect()} 
                    style={{color: 'white', textDecoration: 'none', cursor: 'pointer'}}>
                  Cemetery Plot Recorder
                </a>
              </Typography>
              <Grid item xs />
              <Grid item>
                <UserMenu logout={() => this.logout()} />
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
      </React.Fragment>
    )
  }
}

export default connect(
  (state) => {
    return {

    }
  }, (dispatch) =>{
    return {
      set_auth: (auth) => {
        dispatch(setAuth(auth))
      }
    }
  }
)(withTheme(Header));

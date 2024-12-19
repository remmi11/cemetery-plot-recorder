import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { connect } from "react-redux";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

import ApiInterface from '../lib/ApiInterface.js';
import storejs from 'store';

import { spacing } from "@material-ui/system";
import {
  Hidden,
  CssBaseline,
  Paper as MuiPaper,
  withWidth
} from "@material-ui/core";

import { isWidthUp } from "@material-ui/core/withWidth";
import { setAuth } from '../redux/actions/authActions.js'

const drawerWidth = 59;

const GlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    height: 100%;
  }

  body {
    background: ${props => props.theme.body.background};
  }

  .MuiCardHeader-action .MuiIconButton-root {
    padding: 4px;
    width: 28px;
    height: 28px;
  }
`;

const Root = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Drawer = styled.div`
  ${props => props.theme.breakpoints.up("md")} {
    width: ${drawerWidth}px;

    flex-shrink: 0;
  }
`;

const AppContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Paper = styled(MuiPaper)(spacing);

const MainContent = styled(Paper)`
  flex: 1;
  background: white;
  padding: 0px !important;

  @media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    flex: none;
  }

  .MuiPaper-root .MuiPaper-root {
    box-shadow: none;
  }
`;

const Dashboard = ({children, routes, width}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [count, setCount] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    // Good!
    let token = storejs.get('token', null)
    let api = new ApiInterface(token.access);
    // api.call('api/ticket_count/', {}, function(res){
    //   setCount(res.count)
    // })
  }, []);

  return (
    <Root>
      <CssBaseline />
      <GlobalStyle />

      <Drawer>
        <Hidden mdUp implementation="js">
          <Sidebar
            routes={routes}
            PaperProps={{ style: { width: drawerWidth, background: '#09539c' } }}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            count={count}
          />
        </Hidden>
        <Hidden smDown implementation="css">
          <Sidebar
            routes={routes}
            PaperProps={{ style: { width: drawerWidth, background: '#09539c' } }}
            count={count}
          />
        </Hidden>
      </Drawer>
      <AppContent>
        <Header onDrawerToggle={handleDrawerToggle} />
        <MainContent p={isWidthUp("lg", width) ? 10 : 5}>
          {children}
        </MainContent>
        <Footer />
      </AppContent>
    </Root>
  )
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
)(withWidth()(Dashboard));

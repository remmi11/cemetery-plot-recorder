import React from "react";

import async from "../components/Async";

import {
  Users,
  MapPin,
  CreditCard,
  Settings
} from "react-feather";

// Auth components
const SignIn = async(() => import("../pages/auth/SignIn"));
const Page404 = async(() => import("../pages/auth/Page404"));
const Page500 = async(() => import("../pages/auth/Page500"));

// Dashboards components
// const Default = async(() => import("../pages/dashboards/index"));
const Assets = async(() => import("../pages/Assets"));
const AssetDetail = async(() => import("../pages/assets/AssetDetail"));
const Tickets = async(() => import("../pages/tickets/TableView"));
const UsersComponent = async(() => import("../pages/users/TableView"));
const TicketDetail = async(() => import("../pages/tickets/Detail"));
const UserDetail = async(() => import("../pages/users/Detail"));

// const dashboardsRoutes = {
//   id: "Dashboard",
//   path: "/dashboard",
//   icon: <PieChart />,
//   component: Default,
//   children: null
// };

const authRoutes = {
  id: "Auth",
  path: "/",
  icon: <Users />,
  children: [
    {
      path: "/",
      name: "Sign In",
      component: SignIn
    },
    {
      path: "/auth/404",
      name: "404 Page",
      component: Page404
    },
    {
      path: "/auth/500",
      name: "500 Page",
      component: Page500
    }
  ]
};

const assetsRoutes = {
  id: "Assets",
  path: "/plots",
  icon: <MapPin />,
  component: Assets,
  children: null
};

const ticketsRoutes = {
  id: "Tickets",
  path: "/tickets",
  icon: <CreditCard />,
  component: Tickets,
  children: null
};
const usersRoutes = {
  id: "Users",
  path: "/users",
  icon: <Settings />,
  component: UsersComponent,
  children: null
};

const assetsDetail = {
  id: "AssetDetail",
  path: "/assets/detail/:id",
  icon: <MapPin />,
  component: AssetDetail,
  children: null
};

const ticketDetail = {
  id: "TicketDetail",
  path: "/tickets/detail/:id",
  icon: <MapPin />,
  component: TicketDetail,
  children: null
};

const userDetail = {
  id: "UserDetail",
  path: "/users/detail/:id",
  icon: <Settings />,
  component: UserDetail,
  children: null
};

export const dashboard = [
  // dashboardsRoutes,
  assetsRoutes,
  assetsDetail,
  ticketsRoutes,
  usersRoutes,
  ticketDetail,
  userDetail
];

export const auth = [authRoutes];

export default [
  // dashboardsRoutes,
  assetsRoutes,
  ticketsRoutes,
  usersRoutes,
  authRoutes
];

import React from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { clearExpiredToken } from "@/utils/auth";

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const isExpired = clearExpiredToken();

  if (isExpired || !token) {
    // Redirect to the manual login page instead of the SSO landing
    return <Navigate to="/auth/login" replace />;
  }

  return element;
};

PrivateRoute.propTypes = {
  element: PropTypes.element.isRequired,
};

export default PrivateRoute;
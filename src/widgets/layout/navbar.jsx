import React from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import {
  Navbar as MTNavbar,
  Collapse,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export function Navbar({ brandName, routes, action }) {
  const [openNav, setOpenNav] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all local storage (static; no API call) and go to login page
    try {
      localStorage.clear();
    } catch (err) {
      // ignore storage errors
      // optionally could console.error(err)
    }
    // Assumes login page is at /auth/login — change if your route differs
    navigate("/auth/login");
  };

  React.useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 960 && setOpenNav(false)
    );
  }, []);

  const navList = (
    <ul className="mb-4 mt-2 flex flex-col  gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {routes.map(({ name, path, icon }) => (
        <Typography
          key={name}
          as="li"
          variant="small"
          color="blue-gray"
          className="capitalize"
        >
          <Link to={path} className="flex items-center gap-1 p-1 font-normal">
            {icon &&
              React.createElement(icon, {
                className: "w-[18px] h-[18px] opacity-50 mr-1",
              })}
            {name}
          </Link>
        </Typography>
      ))}
    </ul>
  );

  return (
    <MTNavbar className="p-3">
      <div className="container mx-auto flex items-center justify-between text-blue-gray-900">
        <Link to="/">
          <Typography
            variant="small"
            className="mr-4 ml-2 cursor-pointer py-1.5 font-bold"
          >
            {brandName}
          </Typography>
        </Link>
        <div className="hidden lg:block">{navList}</div>
        {React.cloneElement(action, {
          className: "hidden lg:inline-block",
        })}
        {/* Logout button for desktop (plain, red border, red text) */}
        <Button
          variant="outlined"
          size="sm"
          className="hidden lg:inline-flex items-center gap-2 ml-3 border border-red-500 text-red-600 bg-white hover:bg-red-50"
          onClick={handleLogout}
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
          <span className="text-red-600">Logout</span>
        </Button>
        <IconButton
          variant="text"
          size="sm"
          className="ml-auto text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          onClick={() => setOpenNav(!openNav)}
        >
          {openNav ? (
            <XMarkIcon strokeWidth={2} className="h-6 w-6" />
          ) : (
            <Bars3Icon strokeWidth={2} className="h-6 w-6" />
          )}
        </IconButton>
      </div>
      <Collapse open={openNav}>
        <div className="container mx-auto">
          {navList}
          {React.cloneElement(action, {
            className: "w-full block lg:hidden",
          })}
          {/* Logout button for mobile (plain, full-width, red border) */}
          <Button
            variant="outlined"
            size="sm"
            fullWidth
            className="w-full block lg:hidden mt-2 border border-red-500 text-red-600 bg-white hover:bg-red-50"
            onClick={handleLogout}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Logout</span>
            </div>
          </Button>
        </div>
      </Collapse>
    </MTNavbar>
  );
}

Navbar.defaultProps = {
  brandName: "Jaja Saller",
  action: (
    <a
      href="https://www.creative-tim.com/product/material-tailwind-dashboard-react"
      target="_blank"
    >
      <Button variant="gradient" size="sm" fullWidth>
        free download
      </Button>
    </a>
  ),
};

Navbar.propTypes = {
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  action: PropTypes.node,
};

Navbar.displayName = "/src/widgets/layout/navbar.jsx";

export default Navbar;

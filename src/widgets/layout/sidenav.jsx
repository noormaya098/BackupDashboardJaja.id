import React from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { XMarkIcon, ArrowRightCircleIcon, ArrowDownCircleIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Avatar, Button, IconButton, Typography, Collapse } from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav, setSidenavCollapsed } from "@/context";
import LogoJaja from "../../assets/LogoJaja.png";
import JajaAuto from "../../assets/JajaAuto.png";
import ImageAkun from "../../assets/sidebar/user-avatar.png";
import Bronze from "../../assets/sidebar/Bronze.png";
import Silver from "../../assets/sidebar/Silver.png";
import Gold from "../../assets/sidebar/Gold.png";
import Platinum from "../../assets/sidebar/Platinum.png";

// Placeholder function to get user role from JWT token
// Replace this with your actual method to extract the role

const getUserInfo = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        role: payload.role || null,
        nama_user: payload.nama_user || null,
        id_user: payload.id_user || null,
      };
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return { role: null, nama_user: null, id_user: null };
    }
  }
  return { role: null, nama_user: null, id_user: null };
};

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav, sidenavCollapsed } = controller;
  const [openMenus, setOpenMenus] = useState({});
  const sidenavRef = useRef(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [filteredRoutes, setFilteredRoutes] = useState(routes);

  // Get user info on mount
  useEffect(() => {
    const { role, nama_user, id_user } = getUserInfo();
    console.log("User role from JWT:", role);
    console.log("User name from JWT:", nama_user);
    console.log("User id from JWT:", id_user);
    setUserRole(role);
    setUserName(nama_user);
    setUserId(id_user);
  }, []);

  // Filter routes based on user role
  useEffect(() => {
    if (!userRole) return;

    const allowedPaths = {
      sales: ["/order", "/delivery-order", "/home"],
      ap: ["/purchase", "/notes", "/order", "/pengajuan", "/home", "/sj-invoice"],
      partnership: ["/purchase", "/notes", "/order", "/pengajuan", "/home", "/delivery-order", "/sj-invoice"],
      admin: routes.flatMap((route) => route.pages.map((page) => page.path)),
      accounting: ["/invoice", "/pengajuan", "/purchaseInvoice", "/purchase", "/notes", "/order", "/delivery-order", "/home", "/sj-invoice"],
      "final approver": routes.flatMap((route) => route.pages.map((page) => page.path)),
      supervisor: routes.flatMap((route) => route.pages.map((page) => page.path)),
      superadmin: routes.flatMap((route) => route.pages.map((page) => page.path)),
    };

    console.log("Current user role:", userRole);
    console.log("User role lowercase:", userRole.toLowerCase());
    console.log("Available allowed paths:", Object.keys(allowedPaths));
    
    const normalizedRole = userRole.toLowerCase();
    let accessiblePaths = allowedPaths[normalizedRole] || [];

    // Ensure specific user IDs can see Order and Delivery Order regardless of role
    if (userId === 44 || userId === 39) {
      accessiblePaths = Array.from(new Set([...accessiblePaths, '/order', '/delivery-order']));
    }
    
    console.log("Accessible paths for user:", accessiblePaths);
    console.log("Role found in allowedPaths:", normalizedRole in allowedPaths);

    // Always remove routes marked as hidden from the sidenav
    const sanitizeRoutes = (rts) => rts.map((route) => ({
      ...route,
      pages: route.pages.filter((p) => !p.hidden),
    }));

    // Superadmin dapat mengakses semua menu tanpa filter (tapi tetap sembunyikan yang hidden)
    if (normalizedRole === "superadmin") {
      setFilteredRoutes(sanitizeRoutes(routes));
      return;
    }

    const filtered = routes.map((route) => {
      // Filter sections based on role
      const normalizedRole = userRole?.toLowerCase();
      
      // Khusus untuk role partnership, sembunyikan "Dan Lain-Lain" dan "Manajemen Konten" (Banner)
      if (normalizedRole?.includes("partnership")) {
        if (route.title === "Dan Lain-Lain" || route.title === "Manajemen Konten") {
          return {
            ...route,
            pages: [],
          };
        }
      }

      // Always include the "Dan Lain-Lain" section for other roles
      if (route.title === "Dan Lain-Lain") {
        return route;
      }

      // Filter other sections based on role
      return {
        ...route,
        pages: route.pages.filter((page) => {
          // hide pages explicitly marked hidden
          if (page.hidden) return false;
          // Allow "Beranda" (home) for all roles
          if (page.path === "/home") return true;
          // Check if the page path is in the allowed paths for the role
          return accessiblePaths.includes(page.path);
        }),
      };
    }).filter((route) => route.pages.length > 0); // Remove sections with no pages

    console.log("Filtered routes:", filtered);
    console.log("Number of filtered routes:", filtered.length);
    
    setFilteredRoutes(filtered);
  }, [userRole, routes]);

  const handleToggle = (name) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidenavRef.current && !sidenavRef.current.contains(event.target)) {
        setOpenSidenav(dispatch, false);
      }
    };

    if (openSidenav) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openSidenav, dispatch]);

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-700 to-gray-800",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
    cyan: "bg-gradient-to-br from-cyan-800 to-orange-100",
  };

  const gradientColors = 'from-[#FFA200] via-[#FFA200] to-[#FFB700]';

  return (
    <>
      <div className="xl:hidden fixed top-4 left-4 z-50">
        <IconButton
          variant="text"
          color="gray"
          size="lg"
          onClick={() => setOpenSidenav(dispatch, true)}
          className="bg-white rounded-full shadow-md"
        >
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </IconButton>
      </div>

      <aside
        ref={sidenavRef}
        className={`${sidenavTypes[sidenavType]} ${
          openSidenav ? "translate-x-0" : "-translate-x-80"
        } bg-gradient-to-br from-cyan-700 to-cyan-300 fixed overflow-auto inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] ${
          sidenavCollapsed ? "w-20" : "w-72"
        } rounded-xl transition-all duration-300 xl:translate-x-0 border border-blue-gray-100`}
      >
        <div className="relative">
          <div className={`py-6 ${sidenavCollapsed ? "px-4" : "px-8"} text-center`}>
            <div className="flex items-center justify-between">
              <Link to="/" className="flex-1">
                {!sidenavCollapsed ? (
                  userRole?.toLowerCase().includes("partnership") ? null : (
                    <div className="flex items-center justify-center space-x-2">
                      <img 
                        src={LogoJaja} 
                        alt="Jaja.id" 
                        className="h-8 w-auto object-contain"
                      />
                      <span className="text-white text-2xl font-bold">×</span>
                      <img 
                        src={JajaAuto} 
                        alt="Jaja Auto" 
                        className="h-8 w-auto object-contain"
                      />
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center">
                    <img 
                      src={LogoJaja} 
                      alt="J" 
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                )}
              </Link>
              <IconButton
                variant="text"
                color="white"
                size="sm"
                ripple={false}
                className="ml-2 hover:bg-white/20 transition-all duration-200 rounded-lg"
                onClick={() => setSidenavCollapsed(dispatch, !sidenavCollapsed)}
              >
                <Bars3Icon className="h-6 w-6 text-white" />
              </IconButton>
            </div>
            {!sidenavCollapsed && (
              <div className="flex space-x-4 px-4 pt-4 items-center">
                <div className="w-1/3">
                  <img src={ImageAkun} className="w-18 h-18" alt="" />
                </div>
                <div>
                  <div className="mt-2 uppercase">{userName || "Super Admin"}</div>
                </div>
              </div>
            )}
            {sidenavCollapsed && (
              <div className="flex justify-center pt-4">
                <img src={ImageAkun} className="w-12 h-12" alt="" />
              </div>
            )}
          </div>
          <IconButton
            variant="text"
            color="white"
            size="sm"
            ripple={false}
            className="absolute right-0 top-0 grid rounded-br-none rounded-tl-none xl:hidden"
            onClick={() => setOpenSidenav(dispatch, false)}
          >
            <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
          </IconButton>
        </div>

        <div className={`${sidenavCollapsed ? "ml-2 mr-2" : "ml-4 mr-4"}`}>
          {filteredRoutes.map(({ layout, title, pages }, key) => (
            <ul key={key} className="mb-4 flex flex-col gap-1">
              {title && !sidenavCollapsed && (
                <li className="mx-3.5 mt-4 mb-2">
                  <Typography variant="small" color="dark" className="font-black uppercase opacity-100">
                    {title}
                  </Typography>
                </li>
              )}
              {pages.map(({ icon, name, path, subPages }) => (
                <li key={name}>
                  {subPages ? (
                    <>
                      <div
                        onClick={() => handleToggle(name)}
                        className={`flex bg-transparent items-center gap-4 ${sidenavCollapsed ? "px-2 justify-center" : "px-4"} capitalize w-full text-left text-white cursor-pointer`}
                        style={{ padding: "14px" }}
                        title={sidenavCollapsed ? name : ""}
                      >
                        {icon}
                        {!sidenavCollapsed && (
                          <>
                            <Typography className="font-medium capitalize text-white">
                              {name}
                            </Typography>
                            {openMenus[name] ? (
                              <ArrowDownCircleIcon className="w-5 h-5 ml-auto" />
                            ) : (
                              <ArrowRightCircleIcon className="w-5 h-5 ml-auto" />
                            )}
                          </>
                        )}
                      </div>
                      {!sidenavCollapsed && (
                        <Collapse open={openMenus[name]}>
                          <ul>
                            {subPages.map((subPage) => (
                              <li key={subPage.name}>
                                <NavLink to={`/${layout}${subPage.path}`}>
                                  {({ isActive }) => (
                                    <Button
                                      variant="text"
                                      color="dark"
                                      className={`flex items-center gap-4 px-4 capitalize ${isActive ? `bg-gradient-to-b ${gradientColors} text-[#FFFF]` : ""}`}
                                      fullWidth
                                    >
                                      <div className="pl-9">
                                        <Typography className="font-medium capitalize text-white">
                                          {subPage.name}
                                        </Typography>
                                      </div>
                                    </Button>
                                  )}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </Collapse>
                      )}
                    </>
                  ) : (
                    <NavLink to={`/${layout}${path}`}>
                      {({ isActive }) => (
                        <Button
                          variant="text"
                          color="dark"
                          className={`flex items-center ${sidenavCollapsed ? "justify-center px-2" : "gap-4 px-4"} capitalize ${isActive ? `bg-gradient-to-b ${gradientColors} text-[#ffffff]` : ""}`}
                          fullWidth
                          title={sidenavCollapsed ? name : ""}
                        >
                          <Typography className="text-white font-medium capitalize">
                            {icon}
                          </Typography>
                          {!sidenavCollapsed && (
                            <Typography className="text-white font-medium capitalize">
                              {name}
                            </Typography>
                          )}
                        </Button>
                      )}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </aside>
    </>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Jaja Saller",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;
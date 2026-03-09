import { Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { isTokenExpired } from "@/utils/auth";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType, sidenavCollapsed } = controller;
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Protected route: Check token validity on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Jika tidak ada token atau token expired, redirect ke SSO login
    if (!token || isTokenExpired()) {
      localStorage.clear();
      // Gunakan replace untuk menghindari history stack
      window.location.replace('/auth/sso-callback');
      return; // Stop execution
    }
    
    // Token valid, set authenticated
    setIsAuthenticated(true);
  }, [navigate]);

  // Jangan render apapun jika belum authenticated
  // Ini mencegah blank space dan flash of content
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="min-h-screen bg-cyan-50" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Sidenav
          routes={routes}
          brandImg={
            sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
          }
        />
        <div className={`p-6 transition-all duration-300 ${sidenavCollapsed ? "xl:ml-20" : "xl:ml-72"}`} id="main-content">
          <div className="pl-8">
            <DashboardNavbar />
            {/* <Configurator /> */}
            {/* <IconButton
              size="lg"
              color="white"
              className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
              ripple={false}
              onClick={() => setOpenConfigurator(dispatch, true)}
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </IconButton> */}
             <Routes>
              {routes.map(
                ({ layout, pages }) =>
                  layout === "dashboard" &&
                  pages.map(({ path, element, subPages }) => (
                    <Route key={path} exact path={path} element={element}>
                      {subPages && subPages.map(({ path: subPath, element: subElement }) => (
                        <Route key={subPath} path={subPath} element={subElement} />
                      ))}
                    </Route>
                  ))
              )}
            </Routes>
            {/* <div className="text-blue-gray-600">
              <Footer />
            </div> */}
            <Outlet/>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Navbar,
  Button,
  IconButton,
  Breadcrumbs,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Bars3Icon,
  BellIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import axios from "axios";
import { clearExpiredToken } from "@/utils/auth";
import * as jwt_decode from 'jwt-decode';
import Swal from 'sweetalert2';

export function DashboardNavbar() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname } = useLocation();
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Notifikasi state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Ambil role user dari token
  let userRole = null;
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwt_decode.default(token);
      userRole = decoded.role;
    } catch (e) {
      userRole = null;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isExpired = clearExpiredToken(); // Check and clear if expired

    if (isExpired || !token) {
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/auth/sign-in");
    } else {
      setIsLoggedIn(true);
      fetchNotifications();
    }
  }, [navigate]);

  // Helper untuk ambil/set id notifikasi yang sudah dibaca di localStorage
  const getReadNotificationIds = () => {
    try {
      return JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    } catch {
      return [];
    }
  };
  const setReadNotificationIds = (ids) => {
    localStorage.setItem('readNotificationIds', JSON.stringify(ids));
  };

  // Fungsi untuk mengambil notifikasi dari kedua API
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      };

      // Notifikasi approval pengajuan
      // const approvalResponse = await axios.get(
      //   "https://apidev.jaja.id/nimda/pengajuan/notifikasi-approved",
      //   config
      // );
      // Reminder approval pengajuan
      // const reminderResponse = await axios.get(
      //   "https://apidev.jaja.id/nimda/pengajuan/reminder-approval",
      //   config
      // );
      // Notifikasi tenor
      // const tenorResponse = await axios.get(
      //   "https://apidev.jaja.id/nimda/transaksi/get-reminder-tenor",
      //   config
      // );

      // Mapping notifikasi approval, filter by role
      const approvalNotif = approvalResponse.data.data
        .filter((item) => {
          // Misal, notifikasi punya field role, atau bisa di-mapping dari item
          // Jika tidak ada, tampilkan semua. Jika ada, filter sesuai userRole
          if (!userRole) return true;
          if (item.role && item.role.toLowerCase() === userRole.toLowerCase()) return true;
          // Jika tidak ada field role, bisa di-custom sesuai struktur datamu
          // Atau, jika ingin filter lebih spesifik, tambahkan di sini
          return false;
        })
        .map((item) => ({
          id: `approval-${item.id_pengajuan_approve_history}`,
          title: 'Approval Pengajuan',
          message: `${item.text_description} (${item.tb_pengajuan?.kode_pengajuan || '-'})`,
          time: item.date_history,
          read: false,
          type: 'pengajuan_approved',
          kode_pengajuan: item.tb_pengajuan?.kode_pengajuan,
          id_pengajuan: item.id_pengajuan,
        }));

      // Mapping reminder approval, filter by role
      const reminderNotif = reminderResponse.data.data
        .filter((item) => {
          // Misal, notifikasi punya field role, atau bisa di-mapping dari item
          // Jika tidak ada, tampilkan semua. Jika ada, filter sesuai userRole
          if (!userRole) return true;
          if (item.role && item.role.toLowerCase() === userRole.toLowerCase()) return true;
          // Jika tidak ada field role, bisa di-custom sesuai struktur datamu
          // Atau, jika ingin filter lebih spesifik, tambahkan di sini
          return false;
        })
        .map((item) => ({
          id: `reminder-${item.id_pengajuan}`,
          title: 'Reminder Approval Pengajuan',
          message: `Pengajuan #${item.tb_pengajuan?.kode_pengajuan || item.id_pengajuan} masih pending approval`,
          time: item.tb_pengajuan?.tgl_pengajuan ? formatTime(item.tb_pengajuan.tgl_pengajuan) : '-',
          read: false,
          type: 'pengajuan_reminder',
          kode_pengajuan: item.tb_pengajuan?.kode_pengajuan,
          id_pengajuan: item.id_pengajuan,
        }));

      // Mapping tenor
      const tenorNotifications = tenorResponse.data.data.map((item, index) => ({
        id: `tenor-${index}`,
        title: item.type === "annual" ? "Reminder Tahunan" : "Reminder Bulanan",
        message: `Reminder: ${item.type === "annual" ? "Tahun" : "Bulan"} ke-${item.tenor} untuk Order #${item.order_id}`,
        time: formatTime(item.reminder_date),
        read: item.read || false,
        type: item.type === "annual" ? "annual_tenor" : "monthly_tenor",
      }));

      // Gabungkan semua notifikasi dan urutkan dari terbaru
      const combinedNotifications = [
        ...approvalNotif,
        ...reminderNotif,
        ...tenorNotifications,
      ].sort((a, b) => new Date(b.time) - new Date(a.time));
      // Tandai read jika id ada di localStorage
      const readIds = getReadNotificationIds();
      const withRead = combinedNotifications.map(n => ({ ...n, read: readIds.includes(n.id) }));
      setNotifications(withRead);
      setUnreadCount(withRead.filter(n => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Helper function to format timestamp to relative time
  const formatTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} detik yang lalu`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  // Fungsi untuk menandai notifikasi sebagai dibaca
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      // Assuming there's an API endpoint to mark notification as read
      // await axios.post(
      //   `https://apidev.jaja.id/nimda/notifications/mark-read/${id}`,
      //   {},
      //   { headers: { Authorization: `${token}` } }
      // );

      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Persist ke localStorage
      const readIds = getReadNotificationIds();
      if (!readIds.includes(id)) {
        setReadNotificationIds([...readIds, id]);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Fungsi untuk menandai semua notifikasi sebagai dibaca
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      // Assuming there's an API endpoint to mark all notifications as read
      // await axios.post(
      //   `https://apidev.jaja.id/nimda/notifications/mark-all-read`,
      //   {},
      //   { headers: { Authorization: `${token}` } }
      // );

      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      // Persist semua id ke localStorage
      const allIds = notifications.map(n => n.id);
      setReadNotificationIds(allIds);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Fungsi untuk mendapatkan warna berdasarkan tipe notifikasi
  const getNotificationColor = (type) => {
    switch (type) {
      case 'annual_tenor':
        return 'bg-yellow-100 text-yellow-800';
      case 'monthly_tenor':
        return 'bg-blue-100 text-blue-800';
      case 'pengajuan_approved':
        return 'bg-green-100 text-green-800';
      case 'pengajuan_rejected':
        return 'bg-red-100 text-red-800';
      case 'pengajuan_reminder':
        return 'bg-orange-100 text-orange-800';
      case 'order':
        return 'bg-indigo-100 text-indigo-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'promo':
        return 'bg-purple-100 text-purple-800';
      case 'shipping':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // const handleLogout = async () => {
  // Simple logout: clear localStorage (static) and navigate to local sign-in route
  // Logout with confirmation
  const handleLogout = () => {
    Swal.fire({
      title: 'Apakah Anda yakin ingin logout?',
      text: "Anda harus login kembali untuk mengakses sesi ini.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          localStorage.clear();
        } catch (e) {
          // ignore
        }
        setIsLoggedIn(false);
        navigate("/auth/sign-in");

        // Optional: show success message after logout or before redirect
        // Swal.fire(
        //   'Logged Out!',
        //   'Anda telah berhasil logout.',
        //   'success'
        // )
      }
    });
  };

  return (
    <Navbar
      color={fixedNavbar ? "white" : "transparent"}
      className={`rounded-xl transition-all ${fixedNavbar
          ? "sticky top-4 z-40 py-3 shadow-md shadow-blue-gray-500/5"
          : "px-0 py-1"
        }`}
      fullWidth
      blurred={fixedNavbar}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <IconButton
            variant="text"
            color="blue-gray"
            className="md:hidden"
            onClick={() => setOpenSidenav(dispatch, !openSidenav)}
          >
            {openSidenav ? (
              <XMarkIcon className="h-5 w-5 text-blue-gray-500" />
            ) : (
              <Bars3Icon className="h-5 w-5 text-blue-gray-500" />
            )}
          </IconButton>
          <div className="capitalize">
            <Breadcrumbs
              className={`bg-transparent p-0 transition-all ${fixedNavbar ? "mt-1" : ""
                }`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Menu */}
          <Menu placement="bottom-end">
            <MenuHandler>
              <div className="relative inline-block">
                <IconButton variant="text" color="blue-gray" className="relative">
                  <BellIcon className="h-5 w-5 text-blue-gray-500" />
                </IconButton>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1.5">
                    {unreadCount}
                  </div>
                )}
              </div>
            </MenuHandler>
            <MenuList className="w-96 p-0 border border-gray-100 rounded-lg bg-white shadow-lg">
              <div className="flex justify-between items-center px-4 py-3 border-b">
                <Typography variant="h6" className="text-sm font-semibold text-gray-800">
                  Notifikasi
                </Typography>
                {unreadCount > 0 && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-gray-500"
                  >
                    Tandai semua dibaca
                  </Button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="flex justify-center p-6">
                    <Spinner color="blue" className="h-6 w-6" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const avatarBg = getNotificationColor(notification.type).split(" ")[0];
                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          markAsRead(notification.id);
                          if (
                            notification.type === 'pengajuan_approved' ||
                            notification.type === 'pengajuan_reminder'
                          ) {
                            navigate(`/dashboard/pengajuan/detail/${notification.id_pengajuan}`);
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarBg} text-sm`}>
                            {notification.type === 'annual_tenor' && <BellIcon className="w-5 h-5 text-blue-700" />}
                            {notification.type === 'monthly_tenor' && <BellIcon className="w-5 h-5 text-blue-700" />}
                            {notification.type === 'pengajuan_approved' && <UserCircleIcon className="w-5 h-5 text-green-700" />}
                            {notification.type === 'pengajuan_rejected' && <UserCircleIcon className="w-5 h-5 text-red-700" />}
                            {notification.type === 'pengajuan_reminder' && <BellIcon className="w-5 h-5 text-orange-600" />}
                            {notification.type === 'order' && <Bars3Icon className="w-5 h-5 text-indigo-700" />}
                            {notification.type === 'payment' && <Bars3Icon className="w-5 h-5 text-green-700" />}
                            {notification.type === 'promo' && <BellIcon className="w-5 h-5 text-purple-700" />}
                            {notification.type === 'shipping' && <BellIcon className="w-5 h-5 text-orange-700" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800 truncate">{notification.title}</p>
                            <p className="text-xs text-gray-400 ml-2 whitespace-nowrap">{formatTime(notification.time)}</p>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">{notification.message}</p>
                          {!notification.read && (
                            <span className="inline-flex items-center mt-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600">Baru</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-6">
                    <BellIcon className="h-10 w-10 text-gray-300 mb-2" />
                    <Typography variant="small" className="text-center text-gray-500">
                      Tidak ada notifikasi
                    </Typography>
                  </div>
                )}
              </div>
            </MenuList>
          </Menu>

          {/* Logout button (desktop) - plain with red border and text */}
          <Button
            variant="outlined"
            size="sm"
            className="hidden md:inline-flex items-center gap-2 ml-1 border border-red-500 text-red-600 bg-white hover:bg-red-50"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
            <span className="text-red-600">Logout</span>
          </Button>

          {/* Logout icon (mobile) - plain red icon */}
          <IconButton
            variant="text"
            className="md:hidden text-red-500"
            onClick={handleLogout}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500" />
          </IconButton>

          {/* User Menu */}
          {/* <Menu>
            <MenuHandler>
              <IconButton variant="text" color="blue-gray">
                <UserCircleIcon className="h-5 w-5 text-blue-gray-500" />
              </IconButton>
            </MenuHandler>
            <MenuList className="w-max border-0">
              <MenuItem
                className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-gray-100"
                onClick={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Typography variant="small" className="font-medium">
                    Logout
                  </Typography>
                )}
              </MenuItem>
            </MenuList>
          </Menu> */}
        </div>
      </div>
    </Navbar>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;
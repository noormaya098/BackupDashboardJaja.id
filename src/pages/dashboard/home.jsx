import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Progress,
} from "@material-tailwind/react";

import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import CacheControl from "@/widgets/cache/CacheControl";
import {
  statisticsCardsData,
  statisticsChartsData,
  projectsTableData,
  ordersOverviewData,
} from "@/data";
import {
  CheckCircleIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  BellIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { baseUrl, chartsConfig } from "@/configs";


const products = [
  {
    title: 'Bola Testing',
    price: 'Rp1.000',
    sold: 18,
  },
  {
    title: 'Mobil Mini',
    price: 'Rp2.000',
    sold: 4,
  },
  {
    title: 'Produk Testing 16',
    price: 'Rp10.000',
    sold: 1,
  },
];

const data = [
  { name: 'Laki-Laki', value: 200 },
  { name: 'Perempuan', value: 100 },
  { name: 'Tidak Disebutkan', value: 700 },
];

const tipePembeli = [
  { name: 'Pembeli Baru', value: 600 },
  { name: 'Pembeli Lama', value: 400 },

];

const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];
const COLORSS = ['#0088FE', '#FFBB28'];

// Helper function to calculate days left until due date
const calculateDaysLeft = (dueDateString) => {
  if (!dueDateString) return 0;
  const dueDate = new Date(dueDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to determine status based on days left
const getStatusFromDaysLeft = (daysLeft) => {
  if (daysLeft < 0) return "urgent"; // Past due dates are always urgent
  if (daysLeft <= 3) return "urgent";
  if (daysLeft <= 10) return "warning";
  return "info";
};

// Helper function to extract tenor info from product_description
const extractTenorInfo = (description) => {
  // Example: "Cicilan Bulan 1" -> currentTenor: 1
  const match = description?.match(/Bulan\s+(\d+)/i);
  if (match) {
    return parseInt(match[1]);
  }
  return 1; // Default to 1 if not found
};

// Helper function to format currency
const formatCurrency = (value) => {
  if (!value) return "Rp0";
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return "Rp0";
  return `Rp${numValue.toLocaleString('id-ID')}`;
};


export function Home() {
  const navigate = useNavigate();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Current month (1-12)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Current year

  // State for notifications
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [readNotifications, setReadNotifications] = React.useState(new Set());
  const itemsPerPage = 5;

  // Get user data from localStorage token
  const getUserInfo = () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Raw token from localStorage:', token);

      if (token) {
        // Check if token is JWT format (has dots) or JSON format
        if (token.includes('.')) {
          // JWT format - decode the payload
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('JWT payload:', payload);
          return {
            nama_user: payload.nama_user || 'Admin',
            role: payload.role || 'admin',
            id_user: payload.id_user || null
          };
        } else {
          // JSON format - parse directly
          const userData = JSON.parse(token);
          console.log('JSON userData:', userData);
          return {
            nama_user: userData.nama_user || 'Admin',
            role: userData.role || 'admin',
            id_user: userData.id_user || null
          };
        }
      }
      console.log('No token found in localStorage');
      return { nama_user: 'Admin', role: 'admin', id_user: null };
    } catch (error) {
      console.error('Error parsing token:', error);
      return { nama_user: 'Admin', role: 'admin', id_user: null };
    }
  };

  const { nama_user, role, id_user } = getUserInfo();

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${baseUrl}/nimda/transaksi/get-summary-dashboard?bulan=${selectedMonth}&tahun=${selectedYear}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token && { Authorization: `${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setNotifications([]);
        return;
      }

      const url = `${baseUrl}/nimda/transaksi/get-reminder-tenor`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        // Map API response to notification format
        const mappedNotifications = result.data.map((item, index) => {
          const daysLeft = calculateDaysLeft(item.tanggal_tagih);
          const status = getStatusFromDaysLeft(daysLeft);
          const currentTenor = extractTenorInfo(item.product_description);

          // Use price if available, otherwise use total_tagihan from transaksi
          const amount = item.price
            ? formatCurrency(item.price)
            : formatCurrency(item.transaksi?.total_tagihan || 0);

          // Extract totalTenor - if not available, use currentTenor as default
          // This is a fallback since API doesn't provide totalTenor directly
          let totalTenor = currentTenor;

          return {
            id: item.id_transaksi_direct || item.id_data || index + 1,
            id_data: item.id_data || item.transaksi?.id_data || null, // ID for navigation to detail order
            orderNumber: item.transaksi?.order_id || "N/A",
            productName: item.product_name || "Unknown Product",
            totalTenor: totalTenor, // Default to currentTenor if not available from API
            currentTenor: currentTenor,
            dueDate: item.tanggal_tagih || "",
            daysLeft: daysLeft,
            status: status,
            amount: amount,
          };
        });

        setNotifications(mappedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [fetchDashboardData, fetchNotifications]);

  // Generate months array for dropdown
  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  // Generate years array (last 5 years + current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Create dynamic statistics cards data from API
  const getStatisticsCardsData = () => {
    if (!dashboardData) return statisticsCardsData;

    // Helper function to extract numeric value from currency string
    const extractNumericValue = (valueStr) => {
      if (!valueStr) return 0;
      const numericStr = valueStr.replace(/[^0-9]/g, '');
      return parseInt(numericStr) || 0;
    };

    // Helper function to determine change color
    const getChangeColor = (changeStr) => {
      if (!changeStr) return "text-gray-500";
      const isPositive = !changeStr.startsWith("-");
      return isPositive ? "text-green-500" : "text-red-500";
    };

    return [
      {
        color: "blue",
        icon: ShoppingCartIcon,
        title: "TOTAL ORDER",
        value: dashboardData.total_order?.count?.toLocaleString() || "0",
        subtitle: dashboardData.total_order?.value || "Rp 0",
        footer: {
          color: getChangeColor(dashboardData.total_order?.change),
          value: dashboardData.total_order?.change || "0%",
          label: "than last month",
        },
      },
      {
        color: "green",
        icon: CurrencyDollarIcon,
        title: "TOTAL INVOICE",
        value: dashboardData.total_invoice?.count?.toLocaleString() || "0",
        subtitle: dashboardData.total_invoice?.value || "Rp 0",
        footer: {
          color: getChangeColor(dashboardData.total_invoice?.change),
          value: dashboardData.total_invoice?.change || "0%",
          label: "than last month",
        },
      },
      {
        color: "purple",
        icon: UsersIcon,
        title: "JAJA ID",
        value: dashboardData.jaja_id?.count?.toLocaleString() || "0",
        subtitle: dashboardData.jaja_id?.value || "Rp 0",
        footer: {
          color: getChangeColor(dashboardData.jaja_id?.change),
          value: dashboardData.jaja_id?.change || "0%",
          label: "than last month",
        },
      },
      {
        color: "orange",
        icon: ChartBarIcon,
        title: "JAJA AUTO",
        value: dashboardData.jaja_auto?.count?.toLocaleString() || "0",
        subtitle: dashboardData.jaja_auto?.value || "Rp 0",
        footer: {
          color: getChangeColor(dashboardData.jaja_auto?.change),
          value: dashboardData.jaja_auto?.change || "0%",
          label: "than last month",
        },
      },
    ];
  };

  // Create dynamic chart data
  const getChartData = () => {
    if (!dashboardData) {
      return {
        type: "bar",
        height: 400,
        series: [
          {
            name: "JAJA ID",
            data: [0],
          },
          {
            name: "JAJA AUTO",
            data: [0],
          },
        ],
        options: {
          ...chartsConfig,
          colors: ["#8B5CF6", "#F59E0B"],
          plotOptions: {
            bar: {
              columnWidth: "60%",
              borderRadius: 8,
            },
          },
          xaxis: {
            ...chartsConfig.xaxis,
            categories: ["Current"],
          },
          legend: {
            position: "top",
            horizontalAlign: "right",
          },
        },
      };
    }

    // Helper function to extract numeric value from currency string
    const extractNumericValue = (valueStr) => {
      if (!valueStr) return 0;
      const numericStr = valueStr.replace(/[^0-9]/g, '');
      return parseInt(numericStr) || 0;
    };

    const jajaIdValue = extractNumericValue(dashboardData.jaja_id?.value || "0");
    const jajaAutoValue = extractNumericValue(dashboardData.jaja_auto?.value || "0");

    return {
      type: "bar",
      height: 400,
      series: [
        {
          name: "JAJA ID",
          data: [jajaIdValue],
        },
        {
          name: "JAJA AUTO",
          data: [jajaAutoValue],
        },
      ],
      options: {
        ...chartsConfig,
        colors: ["#8B5CF6", "#F59E0B"],
        plotOptions: {
          bar: {
            columnWidth: "60%",
            borderRadius: 8,
          },
        },
        xaxis: {
          ...chartsConfig.xaxis,
          categories: [`${months[selectedMonth - 1]?.label || selectedMonth} ${selectedYear}`],
        },
        legend: {
          position: "top",
          horizontalAlign: "right",
        },
        yaxis: {
          ...chartsConfig.yaxis,
          labels: {
            ...chartsConfig.yaxis.labels,
            formatter: (value) => {
              if (value >= 1000000000) return `Rp${(value / 1000000000).toFixed(1)} M`;
              if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)} JT`;
              if (value >= 1000) return `Rp${(value / 1000).toFixed(1)} Rb`;
              return `Rp${value}`;
            },
          },
        },
        tooltip: {
          ...chartsConfig.tooltip,
          y: {
            formatter: (value) => {
              return `Rp ${value.toLocaleString('id-ID')}`;
            },
          },
        },
      },
    };
  };

  const dynamicStatisticsCardsData = getStatisticsCardsData();
  const dynamicChartData = getChartData();

  // Filter notifications that are not read
  const visibleNotifications = notifications.filter(notification => !readNotifications.has(notification.id));
  const totalPages = Math.ceil(visibleNotifications.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = visibleNotifications.slice(startIndex, endIndex);

  // Handle mark as read
  const handleMarkAsRead = (notificationId) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mt-12">
        {/* Cache Control Panel */}
        <div className="mb-8 flex justify-end">
          <CacheControl />
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Halo {nama_user}! 👋
              </h1>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full">
                  {role ? role.toUpperCase() : 'ADMIN'}
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                {dashboardData?.filter
                  ? `Data yang ditampilkan berdasarkan ${months[selectedMonth - 1]?.label || selectedMonth} ${selectedYear}`
                  : "Memuat data dashboard..."}
              </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 lg:w-auto">
              <div className="lg:w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Bulan
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:w-48">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Tahun
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        {notificationsLoading ? (
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Progress value={100} className="mb-4" />
                    <Typography variant="h6" className="text-gray-600">
                      Memuat notifikasi...
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : visibleNotifications.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <BellIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Notifikasi Pembayaran
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Orderan yang hampir jatuh tempo pembayaran
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                      {visibleNotifications.length} Notifikasi
                    </span>
                  </div>
                </div>

                {/* Notifications Container with Scroll */}
                <div className="relative">
                  {/* Pagination Controls - Top */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          Page {currentPage + 1} of {totalPages}
                        </span>
                      </div>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <span>Next</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Scrollable Notifications */}
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex space-x-4 pb-4" style={{ width: 'max-content' }}>
                      {currentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (notification.id_data) {
                              navigate(`/dashboard/order/detail-order/${notification.id_data}`);
                            }
                          }}
                          className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex-shrink-0 ${notification.id_data ? 'cursor-pointer hover:border-blue-500' : ''
                            }`}
                          style={{ width: '300px' }}
                        >
                          {/* Status Indicator */}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-3 h-3 rounded-full ${notification.status === 'urgent'
                                ? 'bg-red-500'
                                : notification.status === 'warning'
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                              }`}></div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.status === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : notification.status === 'warning'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                {notification.status === 'urgent' ? 'URGENT' :
                                  notification.status === 'warning' ? 'WARNING' : 'INFO'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent navigation when clicking mark as read
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                                title="Mark as read"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Order Number */}
                            <div>
                              <p className={`text-lg font-bold ${notification.id_data ? 'text-blue-600 hover:text-blue-800' : 'text-gray-900'}`}>
                                {notification.orderNumber}
                                {notification.id_data && (
                                  <span className="ml-2 text-xs text-blue-500">→</span>
                                )}
                              </p>
                            </div>

                            {/* Product Name */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 leading-tight">
                                {notification.productName}
                              </p>
                            </div>

                            {/* Amount */}
                            <div>
                              <p className="text-lg font-bold text-gray-900">
                                {notification.amount}
                              </p>
                            </div>

                            {/* Due Date Info */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  {notification.dueDate}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${notification.daysLeft <= 3 ? 'text-red-600' :
                                    notification.daysLeft <= 10 ? 'text-yellow-600' : 'text-gray-600'
                                  }`}>
                                  {notification.daysLeft} hari
                                </p>
                              </div>
                            </div>

                            {/* Tenor Info */}
                            <div className="pt-3 border-t border-gray-100">
                              <span className="text-xs font-medium text-gray-500">
                                Pembayaran ke-{notification.currentTenor} dari {notification.totalTenor}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mark All as Read Button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    Mark All as Read
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {loading ? (
          <div className="mb-12 flex items-center justify-center py-12">
            <div className="text-center">
              <Progress value={100} className="mb-4" />
              <Typography variant="h6" className="text-gray-600">
                Memuat data dashboard...
              </Typography>
            </div>
          </div>
        ) : (
          <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {dynamicStatisticsCardsData.map(({ icon, title, subtitle, footer, color, ...rest }, index) => (
              <div
                key={title}
                className="group transform hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${color === 'blue' ? 'from-blue-500/10 to-blue-600/5' :
                      color === 'green' ? 'from-green-500/10 to-green-600/5' :
                        color === 'purple' ? 'from-purple-500/10 to-purple-600/5' :
                          'from-orange-500/10 to-orange-600/5'
                    }`}></div>

                  {/* Icon */}
                  <div className="absolute top-6 right-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color === 'blue' ? 'from-blue-500 to-blue-600' :
                        color === 'green' ? 'from-green-500 to-green-600' :
                          color === 'purple' ? 'from-purple-500 to-purple-600' :
                            'from-orange-500 to-orange-600'
                      } flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      {React.createElement(icon, {
                        className: "w-7 h-7 text-white",
                      })}
                    </div>
                  </div>

                  <div className="p-8 relative z-10">
                    <div className="space-y-4">
                      {/* Title */}
                      <Typography variant="small" className="font-bold text-gray-500 uppercase tracking-wider text-xs">
                        {title}
                      </Typography>

                      {/* Main Value */}
                      <Typography variant="h2" className="font-black text-gray-900 leading-none text-3xl">
                        {rest.value}
                      </Typography>

                      {/* Subtitle */}
                      {subtitle && (
                        <Typography variant="small" className="font-bold text-gray-600 text-sm">
                          {subtitle}
                        </Typography>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  {footer && (
                    <div className="px-8 pb-8 pt-0 relative z-10">
                      <div className="flex items-center justify-between w-full bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color === 'blue' ? 'from-blue-500 to-blue-600' :
                              color === 'green' ? 'from-green-500 to-green-600' :
                                color === 'purple' ? 'from-purple-500 to-purple-600' :
                                  'from-orange-500 to-orange-600'
                            } shadow-sm`}></div>
                          <Typography variant="small" className="font-medium text-gray-500 text-xs">
                            {footer.label}
                          </Typography>
                        </div>
                        <Typography className={`font-bold text-sm ${footer.color} px-3 py-1 rounded-full bg-white shadow-sm`}>
                          {footer.value}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Typography variant="h6" className="text-gray-600">
                  Memuat grafik...
                </Typography>
              </div>
            ) : (
              <StatisticsChart
                color="white"
                title="PERBANDINGAN JAJA ID & JAJA AUTO"
                description={`Perbandingan nilai penjualan JAJA ID dan JAJA AUTO untuk ${months[selectedMonth - 1]?.label || selectedMonth} ${selectedYear}`}
                chart={dynamicChartData}
                footer={
                  <Typography
                    variant="small"
                    className="flex items-center font-normal text-blue-gray-600"
                  >
                    &nbsp;Data terupdate real-time
                  </Typography>
                }
              />
            )}
          </div>
        </div>

        {/* Bottom Section */}
      </div>
    </div>
  );
}

export default Home;

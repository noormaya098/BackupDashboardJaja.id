import React, { useState, useEffect } from 'react';
import ProductSelectionModal from './modal';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getAuthHeader } from '../../utils/getAuthHeader';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Divider,
  Typography,
  Space,
  Image,
  Modal,
  Skeleton,
  Checkbox,
  Input,
  notification,
  Upload,
  List,
  Tooltip,
  Badge,
  Progress,
  DatePicker,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';

import {
  ClockCircleOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  PrinterOutlined,
  RollbackOutlined,
  EyeOutlined,
  CalendarOutlined,
  PlusOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined as PendingIcon,
  CrownOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import LogoJaja from '../../assets/LogoJaja.png';
import JajaAuto from '../../assets/JajaAuto.png';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { Title, Text } = Typography;

// Simple in-memory dedupe for fetch requests to avoid duplicate network calls
// keyed by URL + method. This shares the same promise for concurrent calls.
const _inFlightRequests = new Map();

// Throttle/dedupe network error notifications so the UX isn't flooded when the
// API is unreachable. We keep a timestamp per key (e.g. 'network') and only
// notify once per minute by default.
const _errorNotified = new Map();
const notifyOnce = (key, opts = {}) => {
  const now = Date.now();
  const last = _errorNotified.get(key) || 0;
  const ttl = opts.ttl || 60 * 1000; // 1 minute
  if (now - last > ttl) {
    notification.error({
      message: opts.title || 'Error',
      description: opts.description || 'Failed to connect to server',
    });
    _errorNotified.set(key, now);
  }
};

const fetchOnce = (url, options) => {
  const method = (options && options.method) || 'GET';
  const key = `${url}::${method}`;
  if (_inFlightRequests.has(key)) return _inFlightRequests.get(key);

  // Wrap fetch to intercept network errors and show a single throttled
  // notification instead of allowing every component to show the same message.
  const p = fetch(url, options)
    .catch((err) => {
      // Show one global network notification per TTL window.
      notifyOnce('network', { description: (err && err.message) || 'Failed to connect to server' });
      // Re-throw so callers can handle the error as before.
      throw err;
    })
    .finally(() => _inFlightRequests.delete(key));

  _inFlightRequests.set(key, p);
  return p;
};

// CSS kustom untuk responsivitas mobile dan animasi modern
const responsiveStyles = `
  /* Base styles dengan animasi */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .mobile-responsive {
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
    overflow-x: hidden;
    animation: fadeIn 0.6s ease-out;
  }

  .mobile-responsive .ant-card {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .mobile-responsive .ant-card:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  .fade-in-up {
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  .slide-in-right {
    animation: slideInRight 0.5s ease-out;
  }

  /* Modern button styles */
  .mobile-responsive .ant-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .mobile-responsive .ant-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Tab styles */
  .ant-tabs-tab {
    transition: all 0.3s ease;
  }

  .ant-tabs-tab:hover {
    color: #1890ff;
  }

  .ant-tabs-tab-active {
    font-weight: 600;
  }

  /* List item hover effects */
  .ant-list-item {
    transition: all 0.3s ease;
  }

  .ant-list-item:hover {
    transform: translateX(4px);
  }

  /* Card modern styles */
  .modern-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  /* Decorative gradient backgrounds */
  .gradient-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gradient-accent {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .gradient-blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .gradient-purple {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }

  /* Decorative elements */
  .decorative-badge {
    position: relative;
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }

  .decorative-line {
    position: relative;
    padding-left: 16px;
  }

  .decorative-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    /* Changed from purple gradient to solid tosca gradient */
    background: linear-gradient(180deg, #20c997 0%, #14b8a6 100%);
    border-radius: 2px;
  }

  /* Icon decorations */
  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    margin-right: 12px;
  }

  .icon-wrapper-blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
  }

  .icon-wrapper-green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3);
  }

  /* Card with decorative border */
  .decorative-card {
    position: relative;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 250, 0.98) 100%);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(255, 182, 193, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 182, 193, 0.2);
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .decorative-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, rgba(255, 182, 193, 0.8) 0%, rgba(255, 192, 203, 0.6) 50%, rgba(221, 160, 221, 0.8) 100%);
    box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
  }

  /* Floating elements */
  .floating-element {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    filter: blur(40px);
    z-index: 0;
  }

  /* Flower Petal Animations */
  @keyframes float {
    0% {
      transform: translateY(100vh) translateX(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 0.7;
    }
    50% {
      transform: translateY(50vh) translateX(20px) rotate(180deg);
      opacity: 1;
    }
    90% {
      opacity: 0.7;
    }
    100% {
      transform: translateY(-10vh) translateX(0) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes floatReverse {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      transform: translateY(15px) rotate(-180deg);
      opacity: 0.9;
    }
  }

  @keyframes floatSlow {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 0.5;
    }
    33% {
      transform: translate(10px, -15px) rotate(120deg);
      opacity: 0.8;
    }
    66% {
      transform: translate(-10px, -10px) rotate(240deg);
      opacity: 0.7;
    }
  }

  @keyframes sparkle {
    0%, 100% {
      opacity: 0;
      transform: scale(0);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Flower petals container */
  .flower-petals {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .flower-petal {
    position: absolute;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.7), rgba(255, 192, 203, 0.5));
    border-radius: 50% 0 50% 0;
    transform: rotate(45deg);
    animation: float 8s ease-in-out infinite;
    box-shadow: 0 2px 8px rgba(255, 182, 193, 0.4);
  }

  .flower-petal:nth-child(1) {
    left: 10%;
    animation-delay: 0s;
    animation-duration: 10s;
  }

  .flower-petal:nth-child(2) {
    left: 20%;
    animation-delay: 1s;
    animation-duration: 12s;
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.5), rgba(255, 182, 193, 0.3));
  }

  .flower-petal:nth-child(3) {
    left: 30%;
    animation-delay: 2s;
    animation-duration: 9s;
    background: linear-gradient(135deg, rgba(221, 160, 221, 0.6), rgba(238, 130, 238, 0.4));
  }

  .flower-petal:nth-child(4) {
    left: 40%;
    animation-delay: 0.5s;
    animation-duration: 11s;
    background: linear-gradient(135deg, rgba(255, 192, 203, 0.5), rgba(255, 182, 193, 0.3));
  }

  .flower-petal:nth-child(5) {
    left: 50%;
    animation-delay: 1.5s;
    animation-duration: 13s;
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.6), rgba(255, 105, 180, 0.4));
  }

  .flower-petal:nth-child(6) {
    left: 60%;
    animation-delay: 2.5s;
    animation-duration: 10s;
    background: linear-gradient(135deg, rgba(238, 130, 238, 0.5), rgba(221, 160, 221, 0.3));
  }

  .flower-petal:nth-child(7) {
    left: 70%;
    animation-delay: 0.8s;
    animation-duration: 12s;
    background: linear-gradient(135deg, rgba(255, 192, 203, 0.6), rgba(255, 182, 193, 0.4));
  }

  .flower-petal:nth-child(8) {
    left: 80%;
    animation-delay: 1.8s;
    animation-duration: 9s;
    background: linear-gradient(135deg, rgba(255, 182, 193, 0.5), rgba(255, 105, 180, 0.3));
  }

  .flower-petal:nth-child(9) {
    left: 90%;
    animation-delay: 2.2s;
    animation-duration: 11s;
    background: linear-gradient(135deg, rgba(221, 160, 221, 0.6), rgba(238, 130, 238, 0.4));
  }

  .flower-petal:nth-child(10) {
    left: 15%;
    animation-delay: 1.2s;
    animation-duration: 14s;
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.5), rgba(255, 192, 203, 0.3));
  }

  /* Sparkle effects */
  .sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(255, 182, 193, 0.6));
    border-radius: 50%;
    animation: sparkle 2s ease-in-out infinite;
  }

  .sparkle:nth-child(odd) {
    animation-delay: 0.5s;
  }

  .sparkle:nth-child(even) {
    animation-delay: 1s;
  }

  /* Animated background with flowers */
  .flower-bg {
    position: relative;
    overflow: hidden;
  }

  .flower-bg::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: 
      radial-gradient(circle at 20% 30%, rgba(255, 182, 193, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(255, 192, 203, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(221, 160, 221, 0.06) 0%, transparent 50%);
    animation: floatSlow 20s ease-in-out infinite;
    z-index: 0;
  }

  /* Status badge with gradient */
  .status-badge-gradient {
    display: inline-flex;
    align-items: center;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .status-badge-gradient.approved {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }

  .status-badge-gradient.pending {
    background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);
  }

  .status-badge-gradient.rejected {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }

  .mobile-responsive .ant-table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-responsive .ant-table {
    min-width: 100%;
    width: auto;
  }

  .mobile-responsive .ant-btn {
    font-size: 14px;
    padding: 6px 12px;
    height: auto;
    border-radius: 4px;
  }

  .mobile-responsive .grid {
    display: grid;
    gap: 16px;
  }

  /* Button group base styles */
  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .button-group .ant-btn {
    flex: 1 0 auto;
    min-width: 120px;
  }

  /* Header section */
  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  /* Medium screens (tablets) */
  @media (max-width: 768px) {
    .mobile-responsive {
      padding: 12px;
    }

    .mobile-responsive .grid {
      grid-template-columns: 1fr !important;
    }

    .mobile-responsive .ant-card {
      padding: 12px;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 13px;
      padding: 10px 6px;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      font-size: 13px;
      padding: 10px 6px;
    }

    .mobile-responsive .ant-btn {
      font-size: 13px;
      padding: 5px 10px;
    }

    .header-section {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  /* Small screens (mobile phones) */
  @media (max-width: 640px) {
    .mobile-responsive {
      padding: 10px;
    }

    .mobile-responsive .ant-table-wrapper {
      overflow-x: auto;
      max-width: 100%;
    }

    .mobile-responsive .ant-table {
      min-width: 600px;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 12px;
      padding: 8px 4px;
      white-space: nowrap;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      font-size: 12px;
      padding: 8px 4px;
      white-space: nowrap;
    }

/* Tambahkan atau perbarui di dalam responsiveStyles */
.mobile-responsive-card {
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .mobile-responsive-card {
    padding: 12px;
  }

  .mobile-responsive-card .flex {
    flex-direction: column;
    align-items: flex-start;
  }

  .mobile-responsive-card .ant-btn {
    width: 100%;
    margin-bottom: 8px;
  }

  .mobile-responsive-card .flex.space-x-2 {
    flex-direction: column;
    width: 100%;
    align-items: stretch;
  }

  .mobile-responsive-card .flex.space-x-2 .ant-btn {
    width: 100%;
    margin-bottom: 8px;
  }
}

@media (max-width: 640px) {
  .mobile-responsive-card {
    padding: 10px;
  }

  .mobile-responsive-card .text-sm {
    font-size: 12px;
  }

  .mobile-responsive-card .ant-btn {
    font-size: 12px;
    padding: 4px 8px;
  }

  .mobile-responsive-card .w-10 {
    width: 8px;
    height: 8px;
  }
}

    .mobile-responsive .button-group {
      flex-direction: column;
      gap: 6px;
      width: 100%;
    }

    .mobile-responsive .button-group .ant-btn {
      width: 100%;
      min-width: 0;
    }

    .mobile-responsive .ant-typography {
      font-size: 14px;
    }

    .mobile-responsive .ant-modal {
      width: 95% !important;
      margin: 0 auto;
      top: 20px;
    }

    .header-section {
      flex-direction: column;
      align-items: stretch;
    }
  }

  /* Very small screens */
  @media (max-width: 480px) {
    .mobile-responsive {
      padding: 8px;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 11px;
      padding: 6px 3px;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      font-size: 11px;
      padding: 6px 3px;
    }

    .mobile-responsive .ant-btn {
      font-size: 11px;
      padding: 4px 6px;
    }
  }
`;

const OrderDetailPage = () => {
  const { id_data } = useParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, contextHolder] = Modal.useModal();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [tempFile, setTempFile] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [remainingProducts, setRemainingProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const namaCustomer = orderDetails?.nama_customer || "cobra julian";
  const [firstName, ...lastNameParts] = namaCustomer.split(" ");
  const [isUploading, setIsUploading] = useState(false);
  const lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : null;
  const [productStock, setProductStock] = useState({});
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalKeterangan, setApprovalKeterangan] = useState('');
  const [pendingApprovalAction, setPendingApprovalAction] = useState(null);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab_orderDetail') || 'lampiran');
  const [tglSpAsli, setTglSpAsli] = useState(null);


  useEffect(() => {
    localStorage.setItem('activeTab_orderDetail', activeTab);
  }, [activeTab]);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyComment, setHistoryComment] = useState('');
  const [submittingHistory, setSubmittingHistory] = useState(false);

  const reverseStatusMapping = {
    'Menunggu Pembayaran': 'BOOKED',
    'Telah dibayar': 'PAID',
    'Batal': 'CANCEL',
  };

  // Get user role from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  // Derived permissions
  const isAccounting = userRole?.role && String(userRole.role).toLowerCase() === 'accounting';
  const isPartnership = userRole?.role && String(userRole.role).toLowerCase() === 'partnership';

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        const authHeader = getAuthHeader();
        const requestOptions = {
          method: "GET",
          redirect: "follow",
          headers: {
            'Accept': 'application/json',
            ...(authHeader && { 'Authorization': authHeader })
          }
        };
        const response = await fetchOnce(
          `${baseUrl}/nimda/transaksi/detail-transaksi/${id_data}`,
          requestOptions
        );
        const result = await response.json();
        if (result.code === 200) {
          const localOrder = JSON.parse(localStorage.getItem(`order_${id_data}`)) || {};
          const rawData = { ...localOrder, ...result.data };
          const statusResponse = await fetchOnce(
            `${baseUrl}/nimda/transaksi/get-transaksi-status`,
            {
              method: "GET",
              redirect: "follow",
              headers: {
                'Accept': 'application/json',
                ...(authHeader && { 'Authorization': authHeader })
              }
            }
          );
          const statusResult = await statusResponse.json();
          const statusList = statusResult.data || [];
          const statusTransaksi = rawData.id_status
            ? statusList.find(s => s.id_transaksi_status === rawData.id_status)?.name_status || rawData.status_transaksi
            : rawData.status_transaksi;

          // Compute amount untuk tb_transaksi_directs berdasarkan price
          const updatedTransaksiDirects = rawData.tb_transaksi_directs || [];

          // Hitung calculatedSubtotal berdasarkan price
          const calculatedSubtotal = updatedTransaksiDirects.reduce((sum, item) => sum + Number(item.price || 0), 0);

          const normalizedData = {
            order_id: rawData.order_id || `ORDER-${rawData.id_data || ''}`,
            created_date: rawData.created_date || '',
            created_time: rawData.created_time || '',
            nama_customer: rawData.nama_customer || '',
            alamat_pengiriman: rawData.alamat_pengiriman || 'Alamat ',
            nama_penerima: rawData.nama_penerima || rawData.nama_customer || '',
            telp_penerima: rawData.telp_penerima || '',
            brand: rawData.tb_sale?.brand || rawData.brand || 'AUTO',
            subtotal: Number(rawData.subtotal || 0), // Use API's subtotal directly
            biaya_ongkir: Number(rawData.biaya_ongkir || rawData.transaksi_details?.[0]?.ongkir || 0),
            total_tagihan: Number(rawData.total_tagihan || 0), // Use API's total_tagihan directly
            diskon_voucher: Number(rawData.diskon_voucher || 0),
            diskon_voucher_toko: Number(rawData.diskon_voucher_toko || 0),
            pesan_customer: rawData.pesan_customer || rawData.transaksi_details?.[0]?.pesan_customer_toko || '',
            pesan_package: rawData.pesan_package || rawData.transaksi_details?.[0]?.catatan_package_toko || '',
            pengiriman: rawData.pengiriman || rawData.transaksi_details?.[0]?.expedisi || '',
            platform: rawData.platform || (rawData.tb_transaksi_directs?.length > 0 ? 'Direct' : 'Else'),
            tb_transaksi_directs: updatedTransaksiDirects,
            transaksi_details: rawData.transaksi_details || [],
            tb_company: rawData.tb_company || {},
            tb_sale: rawData.tb_sale || {},
            id_data: rawData.id_data,
            status_transaksi: statusTransaksi,
            id_company: rawData.id_company,
            id_sales: rawData.id_sales,
            tb_invoice: rawData.tb_invoice || null,
            // Support both API shapes: tb_delivery_orders (array) or tb_delivery_order (single object)
            tb_delivery_orders: rawData.tb_delivery_orders || (rawData.tb_delivery_order ? [rawData.tb_delivery_order] : []),
            no_referensi: rawData.no_referensi || '',
            approval_status: rawData.approval_status || 'pending',
            id_pengajuan: rawData.id_pengajuan || null,
          };
          setOrderDetails(normalizedData);
          setApprovalStatus(rawData.approval_status || 'pending');
        } else {
          notification.error({
            message: "Error",
            description: "Failed to fetch order details",
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
    fetchAttachments();
    fetchHistory();
  }, [id_data]);

  const fetchAttachments = async () => {
    setAttachmentLoading(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetchOnce(`${baseUrl}/nimda/transaksi/detail-lampiran/${id_data}`, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json',
          ...(authHeader && { 'Authorization': authHeader })
        }
      });
      const result = await response.json();
      if (result.code === 200) {
        const baseUrl = `${baseUrl}/lampiran/`;
        const formattedAttachments = result.data.map(item => ({
          id_lampiran: item.id_transaksi_lampiran,
          nama_file: item.nama_lampiran,
          keterangan: item.keterangan,
          url: `${baseUrl}${item.file_lampiran}`,
          date_added: item.date_added,
          tgl_sp_asli: item.tgl_sp_asli,
        }));
        setAttachments(formattedAttachments);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setAttachmentLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!id_data) return;
    setHistoryLoading(true);
    try {
      const authHeader = getAuthHeader();
      console.log('Fetching history for ID:', id_data);
      console.log('Auth header status:', authHeader ? 'Present' : 'Missing');

      const response = await fetchOnce(`${baseUrl}/nimda/transaksi/history/${id_data}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(authHeader && { 'Authorization': authHeader })
        }
      });

      const result = await response.json();
      console.log('History Fetch Result:', result);

      // Check both .status and .code as different endpoints might use different keys
      if (result.status === 200 || result.code === 200) {
        setHistoryData(result.data || []);
      } else {
        console.warn('History API returned non-200 status:', result);
        if (result.status === 401 || result.code === 401 || result.message?.toLowerCase().includes('authorization')) {
          console.error('Authorization failed for history endpoint. Header used:', authHeader ? 'Bearer ****' : 'none');
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitHistoryComment = async () => {
    if (!historyComment.trim()) {
      notification.warning({ message: 'Peringatan', description: 'Komentar tidak boleh kosong' });
      return;
    }
    setSubmittingHistory(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${baseUrl}/nimda/transaksi/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { 'Authorization': authHeader })
        },
        body: JSON.stringify({
          id_data: id_data,
          komentar: historyComment
        })
      });
      const result = await response.json();
      if (result.code === 201 || result.status === 201) {
        notification.success({ message: 'Sukses', description: 'Komentar berhasil ditambahkan' });
        setHistoryComment('');
        fetchHistory();
      } else {
        notification.error({ message: 'Error', description: result.message || 'Gagal menambahkan komentar' });
      }
    } catch (error) {
      console.error('Error adding history comment:', error);
      notification.error({ message: 'Error', description: 'Terjadi kesalahan sistem' });
    } finally {
      setSubmittingHistory(false);
    }
  };

  const fetchProductStock = async (productIds) => {
    try {
      const authHeader = getAuthHeader();
      let stockMap = {};
      const token = localStorage.getItem('token');
      const allProducts = await fetchAllProducts(token);

      allProducts.forEach((product) => {
        const productId = String(product.id);
        if (productIds.includes(productId)) {
          stockMap[productId] = parseInt(product.stock) || 0;
        }
      });
      setProductStock(prev => {
        const newStock = { ...prev, ...stockMap };
        console.log('Updated stockMap:', stockMap); // Debug stockMap
        console.log('New productStock:', newStock); // Debug final state
        return newStock;
      });
    } catch (error) {
      console.error('Error fetching product stock:', error);
      setProductStock(productIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}));
    }
  };

  useEffect(() => {
    if (orderDetails && orderDetails.tb_transaksi_directs?.length > 0) {
      const productIds = orderDetails.tb_transaksi_directs
        .filter(item => item.product_id)
        .map(item => String(item.product_id));
      if (productIds.length > 0) {
        fetchProductStock(productIds).then(() => {
          console.log('Product Stock:', productStock);
        });
      }
    }
  }, [orderDetails]);

  const handleDeleteAttachment = async (id_lampiran) => {
    Modal.confirm({
      title: 'Konfirmasi Hapus',
      content: 'Apakah Anda yakin ingin menghapus lampiran ini?',
      okText: 'Hapus',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          const authHeader = getAuthHeader();
          const response = await fetch(`${baseUrl}/nimda/transaksi/lampiran/delete/${id_lampiran}`, {
            method: 'DELETE',
            redirect: 'follow',
            headers: {
              ...(authHeader && { 'Authorization': authHeader })
            }
          });
          const result = await response.json();
          if (result.code === 200) {
            notification.success({
              message: 'Sukses',
              description: 'Lampiran berhasil dihapus',
            });
            fetchAttachments();
          }
        } catch (error) {
          console.error('Error deleting attachment:', error);
        }
      },
    });
  };

  const handleUploadAttachment = async ({ file, onSuccess, onError }) => {
    setIsUploading(true);
    const authHeader = getAuthHeader();
    const formData = new FormData();
    formData.append('keterangan', keterangan);
    formData.append('files', file);
    formData.append('tgl_sp_asli', tglSpAsli ? tglSpAsli.format('YYYY-MM-DD') : '');

    try {
      const response = await fetch(`${baseUrl}/nimda/transaksi/${id_data}/lampiran`, {
        method: 'POST',
        body: formData,
        redirect: 'follow',
        headers: {
          ...(authHeader && { 'Authorization': authHeader })
        }
      });
      const result = await response.json();
      if (result.code === 200) {
        notification.success({
          message: 'Sukses',
          description: 'Lampiran berhasil diunggah',
        });
        fetchAttachments();
        setKeterangan('');
        setTglSpAsli(null);
        onSuccess(result);

      } else {
        onError(result);
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
      onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApprovalClick = (status) => {
    setPendingApprovalAction(status);
    setApprovalModalVisible(true);
  };

  const handleApproval = async (status) => {
    if (!orderDetails?.id_data) {
      notification.error({
        message: 'Error',
        description: 'ID Data tidak ditemukan',
      });
      return;
    }

    setApprovalLoading(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${baseUrl}/nimda/transaksi/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify({
          id_data: orderDetails.id_data,
          status: status,
        }),
      });

      const result = await response.json();
      console.log('Approval API Response:', result); // Debug log

      if (result.code === 200 || result.status === 200 || result.message?.includes('berhasil')) {
        setApprovalStatus(status);
        setOrderDetails(prev => ({ ...prev, approval_status: status }));
        notification.success({
          message: 'Sukses',
          description: `Order berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
        });
        setApprovalModalVisible(false);
        setApprovalKeterangan('');
        setPendingApprovalAction(null);

        // Reload the page after successful approval
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        notification.error({
          message: 'Error',
          description: result.message || 'Gagal memproses approval',
        });
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      notification.error({
        message: 'Error',
        description: 'Gagal terhubung ke server',
      });
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleButtonEdit = () => {
    navigate(`/dashboard/order/edit-order/${id_data}`);
  };

  const breakTextIntoLines = (text, maxLength = 70) => {
    if (!text || text === '[]') return [text];
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length >= maxLength) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const breakDescriptionIntoLines = (text, maxLength = 50) => {
    if (!text) return [''];
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length >= maxLength) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const handlePrintInvoice = () => {
    console.log('orderDetails:', orderDetails);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${orderDetails.order_id}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              font-size: 14px;
            }
            .invoice-container {
              max-width: 800px;
              margin: 20px auto;
              padding: 20px;
              box-sizing: border-box;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
            }
            .logo-section {
              text-align: right;
            }
            .company-tagline {
              font-size: 10px;
              margin-top: 4px;
            }
            .status {
              display: inline-block;
              padding: 4px 10px;
              font-size: 12px;
              font-weight: 500;
              margin-bottom: 8px;
              border: 1px solid #e0e0e0;
            }
            .order-info {
              font-size: 12px;
              line-height: 1.4;
            }
            .section-title {
              font-weight: 600;
              margin-bottom: 6px;
              color: #555;
              font-size: 14px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .address-box {
              padding: 10px;
              font-size: 12px;
            }
            .sender-info {
              margin-bottom: 20px;
              padding: 8px 12px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .table th, .table td {
              padding: 10px;
              text-align: left;
              border: 1px solid #e0e0e0;
              vertical-align: middle;
            }
            .table th {
              font-weight: 600;
            }
            .message-box {
              word-break: break-all;
              white-space: normal;
              max-width: 100%;
              padding: 12px;
              font-size: 12px;
            }
            .message-box p {
              margin: 0;
              line-height: 1.4;
            }
            .summary {
              display: grid;
              grid-template-columns: 140px 1fr;
              gap: 8px;
              font-size: 12px;
            }
            .summary-row {
              display: contents;
            }
            .summary-row > span:first-child {
              color: #666;
            }
            .sub-label {
              font-size: 11px;
              margin-left: 12px;
            }
            .divider {
              border-top: 1px solid #e0e0e0;
              margin: 12px 0;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .text-red {
              color: #ff4d4f;
            }
            .grand-total {
              font-weight: 600;
              font-size: 14px;
              color: #333;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #888;
              font-size: 11px;
              padding-top: 12px;
              border-top: 1px dashed #e0e0e0;
            }
            @media (max-width: 640px) {
              .invoice-container {
                padding: 12px;
              }
              .grid {
                grid-template-columns: 1fr;
                gap: 12px;
              }
              .table th, .table td {
                padding: 8px;
                font-size: 11px;
              }
              .summary {
                grid-template-columns: 120px 1fr;
                font-size: 11px;
              }
              .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
              }
              .logo-section {
                text-align: left;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <div class="order-info">
                  <div><strong>Nomor Order :</strong> ${orderDetails.order_id || ''}</div>
                  <div><strong>Tanggal Transaksi :</strong> ${orderDetails.created_date || ''} ${orderDetails.created_time || ''}</div>
                </div>
              </div>
              <div class="logo-section">
                <img
                  src="${orderDetails.brand === 'AUTO' ? JajaAuto : LogoJaja}"
                  alt="${orderDetails.brand === 'AUTO' ? 'JajaAuto' : 'Jaja.id'}"
                  style="height: 40px;"
                />
                <div class="company-tagline">1st Marketplace for Your Hobbies</div>
              </div>
            </div>
            <div class="grid">
              <div>
                <div class="section-title">Tujuan Pengiriman</div>
                <div class="address-box">
                  ${orderDetails.alamat_pengiriman || 'Alamat '}
                </div>
              </div>
              <div>
                <div class="section-title">Penerima</div>
                <div class="address-box">
                  <div style="font-weight: 600; margin-bottom: 4px;">${orderDetails.nama_penerima || orderDetails.nama_customer || ''}</div>
                  <div>${orderDetails.telp_penerima || ''}</div>
                </div>
              </div>
            </div>

            <div class="sender-info">
              <div class="section-title">Pengirim</div>
              <div>${orderDetails.brand || 'Jaja'}</div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 5%;">No.</th>
                  <th style="width: 30%;">Produk</th>
                  <th style="width: 15%;">Deskripsi</th>
                  <th style="width: 15%;">Harga Satuan</th>
                  <th style="width: 10%;" class="text-center">Qty</th>
                  <th style="width: 25%;" class="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${orderDetails.tb_transaksi_directs && orderDetails.tb_transaksi_directs.length > 0
        ? orderDetails.tb_transaksi_directs.map((item, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.product_name || 'Produk '}</td>
                          <td>${breakDescriptionIntoLines(item.product_description || '').map(line => `<div>${line}</div>`).join('')}</td>
                          <td class="text-right">${Number(item.rate).toLocaleString('id-ID')}</td>
                          <td class="text-center">${item.quantity || 0}</td>
                          <td class="text-right">${Number((item.rate || 0) * (item.quantity === 0 ? 1 : item.quantity)).toLocaleString('id-ID')}</td>
                        </tr>
                      `).join('')
        : orderDetails.transaksi_details && orderDetails.transaksi_details.length > 0
          ? orderDetails.transaksi_details.map((item, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${item.nama_produk || 'Produk '}</td>
                          <td>${breakDescriptionIntoLines(item.product_description || '').map(line => `<div>${line}</div>`).join('')}</td>
                          <td class="text-right">Rp ${Number(item.harga_aktif || 0).toLocaleString('id-ID')}</td>
                          <td class="text-center">${item.qty || 0}</td>
                          <td class="text-right">Rp ${Number(item.sub_total || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      `).join('')
          : '<tr><td colspan="6" class="text-center">Tidak ada data produk</td></tr>'
      }
              </tbody>
            </table>

            <div class="grid">
              <div>
                <div class="section-title">Keterangan</div>
                <div class="message-box">
                  ${breakTextIntoLines(orderDetails.pesan_customer || '').map(line => `<p style="margin: 0;">${line}</p>`).join('')}
                </div>

                <div class="section-title" style="margin-top: 12px;">Catatan Package</div>
                <div class="message-box">
                  ${breakTextIntoLines(orderDetails.pesan_package || '').map(line => `<p style="margin: 0;">${line}</p>`).join('')}
                </div>
              </div>
              <div>
                <div class="summary">
                  <span>Total Harga :</span>
                  <span class="text-right">Rp ${Number(orderDetails.subtotal || 0).toLocaleString('id-ID')}</span>

                  <span>Pengiriman :</span>
                  <span class="text-right">Rp ${Number(orderDetails.biaya_ongkir || 0).toLocaleString('id-ID')}</span>

                  <span class="sub-label">${orderDetails.pengiriman || ''} :</span>
                  <span class="text-right"></span>

                  <span>Potongan :</span>
                  <span class="text-right">${orderDetails ? `Rp ${Number(orderDetails.diskon_voucher).toLocaleString('id-ID')}` : '-'}</span>

                  <span>Koin Digunakan :</span>
                  <span class="text-right text-red">- (${Number(orderDetails.diskon_voucher_toko || 0).toLocaleString('id-ID')})</span>
                </div>
                <div class="divider"></div>
                <div class="summary grand-total">
                  <span>GRAND TOTAL :</span>
                  <span class="text-right">Rp ${Number(orderDetails.total_tagihan || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              Terima kasih telah berbelanja di Jaja.id – 1st Marketplace for Your Hobbies
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleBackToList = () => {
    navigate('/dashboard/order');
  };

  const handleSelectProduct = () => {
    if (loading || !orderDetails?.brand) return;
    const isDirect = orderDetails.tb_transaksi_directs?.length > 0;
    const productsFromApi = isDirect
      ? orderDetails.tb_transaksi_directs.map(item => ({
        id: item.product_id || Date.now() + Math.random(),
        id_transaksi_direct: item.id_transaksi_direct,
        name: item.product_name || 'Produk ',
        price: Number(item.rate || 0),
        qty: Number(item.quantity || 0),
        originalQty: Number(item.quantity || 0),
        amount: Number(item.price * (item.quantity === 0 ? 1 : item.quantity) || 0),
        discount: item.discount || 0,
        discount_type: item.discount_type || 'percent',
        product_description: item.product_description || '',
        is_fulfilled: item.is_fulfilled,
      }))
      : orderDetails.transaksi_details.map(item => ({
        id: item.id_detail || Date.now() + Math.random(),
        id_transaksi_direct: null,
        name: item.nama_produk || 'Produk ',
        price: Number(item.harga_aktif || 0),
        qty: Number(item.qty || 1),
        originalQty: Number(item.qty || 1),
        amount: Number(item.sub_total || 0),
        discount: item.discount || 0,
        discount_type: item.discount_type || 'percent',
        product_description: item.product_description || '',
        is_fulfilled: item.is_fulfilled,
      }));

    const availableProducts = productsFromApi;
    if (availableProducts.length === 0) return;

    const modalInstance = Modal.confirm({
      title: null,
      content: (
        <ProductSelectionModal
          visible={true}
          onCancel={() => modalInstance.destroy()}
          onOk={(selected) => {
            setSelectedProducts(selected);
            modalInstance.destroy();
            navigate(`/dashboard/order/select-products/${id_data}`, {
              state: { selectedProducts: selected, orderDetails, isDirect },
            });
          }}
          products={availableProducts}
          isDirect={isDirect}
          brand={orderDetails.brand}
          tb_delivery_orders={orderDetails.tb_delivery_orders || []}
        />
      ),
      footer: null,
      width: '90%',
    });
  };

  const handleDownload = (url, fileName) => {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const handlePreview = (url, fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      Modal.info({
        title: `Preview: ${fileName}`,
        content: <img src={url} alt={fileName} style={{ width: '100%' }} />,
        width: '90%',
      });
    } else if (extension === 'pdf') {
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'green';
      case 'booked':
        return 'orange';
      case 'cancel':
        return 'red';
      case 'partial':
        return 'blue';
      case 'open':
        return 'gold';
      case 'closed':
        return 'volcano';
      default:
        return 'default';
    }
  };

  const getApprovalStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          color: '#52c41a',
          bgColor: '#f6ffed',
          borderColor: '#b7eb8f',
          icon: <CheckCircleOutlined />,
          text: 'Disetujui',
          description: 'Order telah disetujui oleh akunting'
        };
      case 'rejected':
        return {
          color: '#ff4d4f',
          bgColor: '#fff2f0',
          borderColor: '#ffccc7',
          icon: <CloseCircleOutlined />,
          text: 'Ditolak',
          description: 'Order ditolak oleh akunting'
        };
      case 'pending':
      default:
        return {
          color: '#1890ff',
          bgColor: '#f0f8ff',
          borderColor: '#bae7ff',
          icon: <PendingIcon />,
          text: 'Menunggu Persetujuan',
          description: 'Menunggu persetujuan dari akunting'
        };
    }
  };

  const ApprovalStatusCard = ({ status, canApprove, onApproveClick, showReject = false }) => {
    const config = getApprovalStatusConfig(status);

    return (
      <Card
        className="mb-6 border rounded-lg shadow-sm mobile-responsive-card"
        style={{
          borderColor: config.borderColor,
          padding: '16px',
          borderRadius: '12px',
        }}
      >
        <div className="flex flex-col items-start">
          {/* Ikon dan Judul */}
          <div className="flex items-center space-x-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                backgroundColor: '#1890ff',
                color: 'white',
                fontSize: '18px',
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div>
              <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                Status Approval
              </Text>
              <div className="text-gray-600 text-sm">
                • {config.text}
                <br />
                {config.description}
              </div>
            </div>
          </div>

          {/* Tombol Approval */}
          {canApprove && status === 'pending' && (
            <div className="flex space-x-2 mb-3 w-full justify-end">
              {showReject && (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => onApproveClick('rejected')}
                  loading={approvalLoading}
                  className="rounded-md flex-0"
                  style={{
                    backgroundColor: '#ff4d4f',
                    borderColor: '#ff4d4f',
                    color: 'white',
                    padding: '0 12px',
                  }}
                >
                  Tolak
                </Button>
              )}
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onApproveClick('approved')}
                loading={approvalLoading}
                className="rounded-md flex-0"
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  color: 'white',
                  padding: '0 12px',
                }}
              >
                Setujui
              </Button>
            </div>
          )}

          {/* Status Proses */}
          {status === 'pending' && (
            <div className="text-gray-500 text-xs mt-2">
              Proses approval sedang menunggu tindakan akunting
            </div>
          )}
        </div>
      </Card>
    );
  };

  const columns = [
    { title: 'No', key: 'index', render: (_, __, index) => index + 1 },
    {
      title: 'Image',
      dataIndex: 'foto_produk',
      key: 'foto_produk',
      render: (_, record) => (
        <Image
          src={record.foto_produk || 'https://via.placeholder.com/150'}
          alt={record.nama_produk}
          width={60}
          height={60}
          className="object-cover rounded-md"
        />
      )
    },
    {
      title: 'Produk',
      dataIndex: 'nama_produk',
      key: 'nama_produk',
      render: text => <Text strong>{text}</Text>
    },
    {
      title: 'Deskripsi',
      dataIndex: 'product_description',
      key: 'product_description',
      render: description => (
        <div className="text-xs text-gray-500">
          {description ? (
            breakDescriptionIntoLines(description).map((line, i) => <div key={i}>{line}</div>)
          ) : <div></div>}
        </div>
      )
    },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', render: qty => <span className="font-medium">{qty}</span> },
    { title: 'Harga', dataIndex: 'harga_aktif', key: 'harga', render: price => `Rp ${Number(price).toLocaleString('id-ID')}` },
    { title: 'Discount (%)', dataIndex: 'discount', key: 'discount', render: discount => discount ? `${Number(discount).toLocaleString('id-ID')}%` : '0%' },
    { title: 'Jumlah', dataIndex: 'sub_total', key: 'subtotal', render: subtotal => `Rp ${Number(subtotal).toLocaleString('id-ID')}` },
  ];

  const historyColumns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 70,
      align: 'center',
      render: (text, record, index) => index + 1,
    },

    {
      title: 'User',
      dataIndex: 'nama_lengkap',
      key: 'nama_lengkap',
      width: 220,
      render: (text, record) => <Text strong>{text || record.username || '-'}</Text>,
    },
    {
      title: 'Tanggal',
      dataIndex: 'tgl',
      key: 'tgl',
      width: 180,
      render: (text) => (text ? new Date(text).toLocaleString('id-ID') : '-'),
    },
    {
      title: 'Keterangan',
      dataIndex: 'komentar',
      key: 'komentar',
      render: (text) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>,
    },
  ];

  const invoiceColumns = [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 50 },
    { title: 'Produk', key: 'product', render: (_, record) => <span>{record.product}</span> },
    {
      title: 'Deskripsi',
      dataIndex: 'product_description',
      key: 'product_description',
      render: description => (
        <div className="text-xs text-gray-500">
          {description ? (
            breakDescriptionIntoLines(description).map((line, i) => <div key={i}>{line}</div>)
          ) : <div></div>}
        </div>
      ),
    },
    ...(orderDetails?.brand === 'AUTO'
      ? [
        {
          title: 'Date',
          dataIndex: 'tanggal_tagih',
          key: 'tanggal_tagih',
          align: 'center',
          render: tanggal_tagih =>
            tanggal_tagih ? new Date(tanggal_tagih).toLocaleDateString('id-ID') : '-',
        },
      ]
      : []),
    { title: 'Harga Satuan', dataIndex: 'price', key: 'price', align: 'right' },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      render: qty => qty || 0,
    },
    // ...(orderDetails?.platform === 'Direct'
    //     ? [
    //         {
    //             title: 'Stok',
    //             key: 'stock',
    //             align: 'center',
    //             render: (_, record) => {
    //                 // Ensure product_id is a string
    //                 const recordProductId = String(record.product_id);
    //                 // Check if the product description contains "tenor" or "DP" (case-insensitive)
    //                 const isTenorOrDP = record.product_description?.toLowerCase().includes('tenor') || 
    //                                     record.product_description?.toLowerCase().includes('dp');

    //                 // Get stock value for the product
    //                 const stockValue = parseInt(productStock[recordProductId]) || 0;

    //                 if (!isTenorOrDP) {
    //                     // For non-tenor/DP products, check if stock is sufficient
    //                     console.log(`Non-Tenor Row - Product ID: ${recordProductId}, Stock: ${stockValue}, Qty: ${record.quantity}`); // Debug
    //                     return (
    //                         <span>
    //                             {stockValue >= record.quantity ? (
    //                                 <span style={{ color: 'green', fontSize: '20px' }}>✅</span>
    //                             ) : (
    //                                 <span style={{ color: 'red', fontSize: '20px' }}>❌</span>
    //                             )}
    //                         </span>
    //                     );
    //                 }

    //                 // For tenor or DP products, check stock for total ordered quantity
    //                 const totalOrderedQty = orderDetails.tb_transaksi_directs
    //                     .filter(item => String(item.product_id) === recordProductId)
    //                     .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    //                 const hasSufficientStock = stockValue >= totalOrderedQty;

    //                 // Check delivery orders as fallback
    //                 const hasDO = orderDetails.tb_delivery_orders?.some(doItem =>
    //                     doItem.tb_delivery_order_details?.some(
    //                         detail => String(detail.product_id) === recordProductId &&
    //                                   detail.quantity >= record.quantity
    //                     )
    //                 );

    //                 // Detailed debug log
    //                 console.log(`Tenor Row - Product ID: ${recordProductId}, Stock: ${stockValue}, Total Ordered Qty: ${totalOrderedQty}, Has DO: ${hasDO}, Sufficient Stock: ${hasSufficientStock}`);

    //                 return (
    //                     <span>
    //                         {hasSufficientStock || hasDO ? (
    //                             <span style={{ color: 'green', fontSize: '20px' }}>✅</span>
    //                         ) : (
    //                             <span style={{ color: 'red', fontSize: '20px' }}>❌</span>
    //                         )}
    //                     </span>
    //                 );
    //             },
    //         },
    //     ]
    //     : []),
    {
      title: 'Discount (%)',
      dataIndex: 'discount',
      key: 'discount',
      align: 'center',
      render: discount => (discount ? `${discount}%` : '0%'),
    },
    { title: 'Sub Total', dataIndex: 'subtotal', key: 'subtotal', align: 'right' },
  ];

  if (loading) {
    return (
      <div className="mobile-responsive">
        <Skeleton active />
        <Divider />
        <Skeleton active />
      </div>
    );
  }

  // Only show "not found" when we're NOT loading and there's no data.
  // If the API is still fetching, the earlier `if (loading)` branch will show
  // the loading skeleton. This prevents showing a false "Data order tidak
  // ditemukan" while requests are in-flight.
  if (!orderDetails && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 mobile-responsive">
        <ExclamationCircleOutlined style={{ fontSize: 36, color: '#f5222d' }} />
        <Title level={4} className="mt-3">Data order tidak ditemukan</Title>
        <Button type="primary" onClick={handleBackToList} className="mt-3">Kembali</Button>
      </div>
    );
  }

  if (orderDetails.platform === 'Direct' || orderDetails.tb_transaksi_directs?.length > 0) {
    const calculatedSubtotal = orderDetails.tb_transaksi_directs.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const updatedOrderDetails = {
      ...orderDetails,
      subtotal: orderDetails.subtotal || calculatedSubtotal,
      biaya_ongkir: orderDetails.biaya_ongkir || 0,
      total_tagihan: orderDetails.total_tagihan || calculatedSubtotal + (orderDetails.biaya_ongkir || 0) - (orderDetails.diskon_voucher || 0) - (orderDetails.diskon_voucher_toko || 0),
      order_id: orderDetails.order_id || `DIRECT-${orderDetails.id_data}`,
      alamat_pengiriman: orderDetails.alamat_pengiriman || 'Alamat Tidak Disediakan',
      nama_penerima: orderDetails.nama_penerima || 'Penerima Tidak Diketahui',
      telp_penerima: orderDetails.telp_penerima || '',
      pengiriman: orderDetails.pengiriman || '',
    };

    const productData = updatedOrderDetails.tb_transaksi_directs
      .sort((a, b) => a.id_transaksi_direct - b.id_transaksi_direct) // Sort by id_transaksi_direct to maintain input order
      .map((item, index) => ({
        key: item.id_transaksi_direct, // Use id_transaksi_direct as the unique key
        no: index + 1,
        product: item.product_name || 'Produk ',
        product_description: item.product_description || '',
        price: `${Number(item.rate || 0).toLocaleString('id-ID')}`,
        quantity: item.quantity || 0,
        originalQty: item.quantity || 0, // Ensure originalQty is set to the ordered quantity
        discount: item.discount || 0,
        subtotal: `${(Number(item.rate || 0) * (item.quantity === 0 ? 1 : item.quantity)).toLocaleString('id-ID')}`,
        product_id: item.product_id,
        stock: productStock[item.product_id] || '0',
        tanggal_tagih: item.tanggal_tagih
      }));

    return (
      <>
        <style>{responsiveStyles}</style>
        {/* Flower Petals Animation */}
        <div className="flower-petals">
          {[10, 25, 40, 55, 70, 15, 30, 45, 60, 80].map((left, i) => (
            <div
              key={i}
              className="flower-petal"
              style={{
                left: `${left}%`,
                top: '100vh',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${10 + (i % 4) * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="max-w-9xl mx-auto mobile-responsive" style={{ position: 'relative', zIndex: 1 }}>
          {contextHolder}
          <Card
            bordered={false}
            className="fade-in-up flower-bg"
            style={{
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(255, 182, 193, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 182, 193, 0.15)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.95) 100%)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Approval Status Card */}
            <ApprovalStatusCard
              status={approvalStatus || 'pending'}
              // Only allow accounting role (or legacy id_user === 44) to approve orders
              canApprove={isAccounting || userRole?.id_user === 44}
              showReject={isAccounting || userRole?.id_user === 44}
              onApproveClick={handleApprovalClick}
            />

            <div className="header-section fade-in-up" style={{ animationDelay: '0.1s', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <Title level={3} className="m-0" style={{ fontWeight: 700, marginBottom: '4px', color: '#20c997' }}>
                    Detail Sales Order
                  </Title>
                </div>
              </div>
              <div className="button-group">
                <Tooltip title={approvalStatus !== 'approved' ? 'Order harus disetujui terlebih dahulu' : isAccounting ? 'Aksi tidak tersedia untuk role accounting' : ''}>
                  <Link to={approvalStatus === 'approved' ? `/dashboard/pengajuan/add/${orderDetails.id_data}` : '#'}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                      disabled={approvalStatus !== 'approved' || isAccounting}
                      className={approvalStatus !== 'approved' || isAccounting ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      Pengajuan
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip title={approvalStatus !== 'approved' ? 'Order harus disetujui terlebih dahulu' : isAccounting ? 'Aksi tidak tersedia untuk role accounting' : ''}>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={handleSelectProduct}
                    disabled={approvalStatus !== 'approved' || isAccounting}
                    className={approvalStatus !== 'approved' || isAccounting ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    + Delivery
                  </Button>
                </Tooltip>
                <Tooltip title={orderDetails.tb_delivery_orders?.length > 0 ? 'Order tidak dapat diedit karena sudah ada delivery order' : isAccounting ? 'Aksi tidak tersedia untuk role accounting' : isPartnership ? 'Aksi tidak tersedia untuk role partnership' : userRole?.id_user === 44 ? 'Tidak diperkenankan mengedit order' : ''}>
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
                    onClick={handleButtonEdit}
                    disabled={orderDetails.tb_delivery_orders?.length > 0 || isAccounting || userRole?.id_user === 44 || isPartnership}
                    className={orderDetails.tb_delivery_orders?.length > 0 || isAccounting || userRole?.id_user === 44 || isPartnership ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Edit Order
                  </Button>
                </Tooltip>
                <Button type="primary" icon={<PrinterOutlined />} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }} onClick={handlePrintInvoice}>Print</Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-5">
              <div className="mb-4 md:mb-0">
                <div className="mb-1">Nomor Order: {updatedOrderDetails.order_id}</div>
                <div>Tanggal: {updatedOrderDetails.created_date} {updatedOrderDetails.created_time}</div>
                {updatedOrderDetails.no_referensi && (
                  <div>No Referensi: {updatedOrderDetails.no_referensi}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              <Card className="decorative-line" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EnvironmentOutlined style={{ color: '#667eea', fontSize: '18px' }} />
                  <div className="text-gray-600 font-semibold">Detail Pengiriman</div>
                </div>
                <div className="space-y-2">
                  <div>Alamat: {updatedOrderDetails.alamat_pengiriman}</div>
                  <div>Penerima: {updatedOrderDetails.nama_penerima}</div>
                  <div>No. Telepon: {updatedOrderDetails.telp_penerima}</div>
                </div>
              </Card>
              <Card className="decorative-line" style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <div className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined style={{ color: '#667eea', fontSize: '18px' }} />
                  <div className="text-gray-600 font-semibold">Detail Pemesan</div>
                </div>
                <div className="space-y-2">
                  <div>Nama: {updatedOrderDetails.nama_customer}</div>
                  <div>Customer Type: {(updatedOrderDetails.tb_company?.company_name === 'Personal' || updatedOrderDetails.id_company === 1) ? 'B2C' : 'B2B'}</div>
                  <div>Cabang: {updatedOrderDetails.tb_company?.company_name || '-'}</div>
                  <div>Status: <Tag color={getStatusColor(updatedOrderDetails.status_transaksi)}>{updatedOrderDetails.status_transaksi}</Tag></div>
                </div>
              </Card>
            </div>

            <div className="mb-5">Pengirim: Raja Cepat</div>

            <Table
              columns={invoiceColumns}
              dataSource={productData}
              pagination={false}
              rowKey="key"
              className="mb-5"
              scroll={{ x: true }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 text-gray-600">Keterangan:</div>
                <div className="text-gray-500 italic text-xs">
                  {breakTextIntoLines(updatedOrderDetails.pesan_customer).map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="mt-3 mb-2 text-gray-600">Catatan Package:</div>
                <div className="text-gray-500 italic text-xs">
                  {breakTextIntoLines(updatedOrderDetails.pesan_package).map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <span>Total Harga:</span>
                    <span className="text-right">Rp {Number(updatedOrderDetails.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                    <span>Pengiriman:</span>
                    <span className="text-right">Rp {Number(updatedOrderDetails.biaya_ongkir).toLocaleString('id-ID')}</span>
                  </div>
                  <Divider className="my-2" />
                  <div className="grid grid-cols-2 gap-2 font-medium text-sm">
                    <span>GRAND TOTAL:</span>
                    <span className="text-right">Rp {Number(updatedOrderDetails.subtotal).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            {/* Modern Tab Section */}
            <Card className="mt-6 fade-in-up decorative-card flower-bg" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => {
                    setActiveTab(key);
                    if (key === 'history') fetchHistory();
                  }}
                  items={[
                    {
                      key: 'lampiran',
                      label: (
                        <span className="flex items-center gap-2">
                          <FileTextOutlined />
                          Lampiran
                          {attachments.length > 0 && (
                            <Badge count={attachments.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <div className="flex justify-between items-center mb-4">
                            <Title level={5} className="m-0" style={{ fontWeight: 600 }}>Lampiran</Title>
                            <Tooltip title={isAccounting ? 'Aksi tidak tersedia untuk role accounting' : isPartnership ? 'Aksi tidak tersedia untuk role partnership' : userRole?.id_user === 44 ? 'Tidak diperkenankan mengunggah lampiran' : ''}>
                              <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => { if (!isAccounting && userRole?.id_user !== 44 && !isPartnership) setIsModalVisible(true); }}
                                style={{
                                  borderRadius: '8px',
                                  backgroundColor: '#1890ff',
                                  borderColor: '#1890ff',
                                  color: '#fff'
                                }}
                                disabled={isAccounting || userRole?.id_user === 44 || isPartnership}
                                className={isAccounting || userRole?.id_user === 44 || isPartnership ? 'opacity-50 cursor-not-allowed' : ''}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1890ff';
                                  e.currentTarget.style.borderColor = '#1890ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1890ff';
                                  e.currentTarget.style.borderColor = '#1890ff';
                                }}
                              >
                                Unggah Lampiran
                              </Button>
                            </Tooltip>
                          </div>
                          <Modal
                            title="Unggah Lampiran"
                            visible={isModalVisible}
                            onCancel={() => { setIsModalVisible(false); setKeterangan(''); setTempFile(null); setTglSpAsli(null); }}
                            footer={[
                              <Button key="cancel" onClick={() => { setIsModalVisible(false); setKeterangan(''); setTempFile(null); setTglSpAsli(null); }}>Cancel</Button>,
                              <Button
                                key="submit"
                                type="primary"
                                loading={isUploading}
                                onClick={() => {
                                  if (!tglSpAsli) {
                                    notification.error({ message: 'Error', description: 'Tanggal SP Asli wajib diisi' });
                                    return;
                                  }
                                  if (tempFile) {
                                    handleUploadAttachment({ file: tempFile, onSuccess: () => setIsModalVisible(false), onError: () => { } });
                                  }
                                }}
                                disabled={!tempFile || !tglSpAsli || isUploading}
                              >
                                OK
                              </Button>,
                            ]}
                            width={600}
                            centered
                          >
                            <div className="flex flex-col gap-4 pt-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Text strong style={{ minWidth: '130px' }}>Tgl SP Asli <span style={{ color: 'red' }}>*</span></Text>
                                <DatePicker
                                  style={{ width: '100%' }}
                                  value={tglSpAsli}
                                  onChange={(date) => setTglSpAsli(date)}
                                  placeholder="Pilih tanggal"
                                  format="YYYY-MM-DD"
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Text strong style={{ minWidth: '130px' }}>Keterangan</Text>
                                <Input
                                  placeholder="Masukkan keterangan lampiran"
                                  value={keterangan}
                                  onChange={(e) => setKeterangan(e.target.value)}
                                  style={{ width: '100%' }}
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Text strong style={{ minWidth: '130px' }}>File</Text>
                                <Upload
                                  customRequest={({ file }) => setTempFile(file)}
                                  showUploadList={true}
                                  fileList={tempFile ? [{ uid: '-1', name: tempFile.name, status: 'done' }] : []}
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onRemove={() => setTempFile(null)}
                                  className="w-full"
                                >
                                  <Button icon={<UploadOutlined />} block className="sm:inline-flex sm:w-auto">Pilih File</Button>
                                </Upload>
                              </div>
                            </div>

                          </Modal>
                          <List
                            loading={attachmentLoading}
                            dataSource={attachments}
                            renderItem={(item) => (
                              <List.Item
                                className="hover:bg-gray-50 transition-colors rounded-lg"
                                style={{
                                  padding: '12px',
                                  marginBottom: '8px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}
                                actions={[
                                  <Button
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview(item.url, item.nama_file)}
                                    size="small"
                                    style={{ borderRadius: '6px' }}
                                  >
                                    Preview
                                  </Button>,
                                  // <Button 
                                  //   icon={<DeleteOutlined />} 
                                  //   onClick={() => handleDeleteAttachment(item.id_lampiran)} 
                                  //   danger 
                                  //   size="small"
                                  //   style={{ borderRadius: '6px' }}
                                  // >
                                  //   Hapus
                                  // </Button>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#1890ff', fontWeight: 500 }}
                                    >
                                      {item.nama_file}
                                    </a>
                                  }
                                  description={
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      <div>Diunggah : {item.date_added ? new Date(item.date_added).toLocaleString('id-ID') : 'Tanggal'}</div>
                                      <div>Keterangan : {item.keterangan || 'Tidak ada'}</div>
                                      {item.tgl_sp_asli && <div>Tgl SP Asli : {dayjs(item.tgl_sp_asli).format('DD/MM/YYYY')}</div>}

                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: 'Belum ada lampiran' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'history',
                      label: (
                        <span className="flex items-center gap-2">
                          <CommentOutlined />
                          History
                          {historyData.length > 0 && (
                            <Badge count={historyData.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Riwayat</Title>
                          <div className="flex gap-2 mb-4">
                            <Input
                              placeholder="Add comment manual for this SO..."
                              value={historyComment}
                              onChange={(e) => setHistoryComment(e.target.value)}
                            />
                            <Button
                              className='bg-blue-500 text-white'
                              loading={submittingHistory}
                              onClick={handleSubmitHistoryComment}
                            >
                              Add Comment
                            </Button>
                          </div>
                          <Table
                            loading={historyLoading}
                            dataSource={historyData}
                            columns={historyColumns}
                            pagination={{ pageSize: 5, size: 'small' }}
                            rowKey={(record) => record.id_transaksi_history || record.tgl}
                            size="small"
                            className="ant-table-custom"
                            locale={{ emptyText: 'Belum ada riwayat' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'delivery-order',
                      label: (
                        <span className="flex items-center gap-2">
                          <TruckOutlined />
                          Delivery Order
                          {orderDetails.tb_delivery_orders?.length > 0 && (
                            <Badge count={orderDetails.tb_delivery_orders.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Daftar Delivery Order</Title>
                          <List
                            dataSource={orderDetails.tb_delivery_orders || []}
                            renderItem={(item) => (
                              <List.Item
                                className="hover:bg-gray-50 transition-colors rounded-lg"
                                style={{
                                  padding: '16px',
                                  marginBottom: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}
                                actions={[
                                  <Link to={`/dashboard/delivery-order/detail/${item.id_delivery_order}`}>
                                    <Button
                                      icon={<EyeOutlined />}
                                      size="small"
                                      type="primary"
                                      style={{
                                        borderRadius: '6px',
                                        backgroundColor: '#1890ff',
                                        borderColor: '#1890ff',
                                        color: '#fff'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1890ff';
                                        e.currentTarget.style.borderColor = '#1890ff';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1890ff';
                                        e.currentTarget.style.borderColor = '#1890ff';
                                      }}
                                    >
                                      Lihat Detail
                                    </Button>
                                  </Link>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={<Text strong style={{ fontSize: '16px' }}>{item.code_delivery_order || 'DO'}</Text>}
                                  description={
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ marginTop: '8px' }}>
                                      <div>
                                        <div style={{ marginBottom: '4px' }}>Tanggal: {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString('id-ID') : '-'}</div>
                                        <div style={{ marginBottom: '4px' }}>Tracking: {item.tracking_no || '-'}</div>
                                        <div>Message: {item.message || '-'}</div>
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Produk:</div>
                                        {item.tb_delivery_order_details?.map((detail, index) => {
                                          const product = orderDetails.tb_transaksi_directs.find(
                                            (trans) => trans.product_id === detail.product_id
                                          );
                                          const productName = product ? product.product_name : 'Produk Tidak Dikenal';
                                          return (
                                            <div key={index} style={{ marginBottom: '2px' }}>
                                              {productName} (Qty: {detail.quantity})
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: 'Belum ada delivery order' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'pengajuan',
                      label: (
                        <span className="flex items-center gap-2">
                          <FileTextOutlined />
                          Pengajuan
                          {orderDetails.tb_transaksi_directs?.filter(
                            item =>
                              item.tb_pengajuan_transaksi_detail &&
                              item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                              item.tb_pengajuan_transaksi_detail.id_pengajuan
                          ).length > 0 && (
                              <Badge
                                count={
                                  orderDetails.tb_transaksi_directs
                                    .filter(
                                      item =>
                                        item.tb_pengajuan_transaksi_detail &&
                                        item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                                        item.tb_pengajuan_transaksi_detail.id_pengajuan
                                    )
                                    .reduce((unique, item) => {
                                      const pengajuan = item.tb_pengajuan_transaksi_detail.tb_pengajuan;
                                      if (pengajuan && !unique.some(u => u.id_pengajuan === pengajuan.id_pengajuan)) {
                                        unique.push(pengajuan);
                                      }
                                      return unique;
                                    }, []).length
                                }
                                size="small"
                              />
                            )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Daftar Pengajuan</Title>
                          <List
                            dataSource={
                              orderDetails.tb_transaksi_directs
                                ? orderDetails.tb_transaksi_directs
                                  .filter(
                                    item =>
                                      item.tb_pengajuan_transaksi_detail &&
                                      item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                                      item.tb_pengajuan_transaksi_detail.id_pengajuan
                                  )
                                  .reduce((unique, item) => {
                                    const pengajuan = item.tb_pengajuan_transaksi_detail.tb_pengajuan;
                                    if (pengajuan && !unique.some(u => u.id_pengajuan === pengajuan.id_pengajuan)) {
                                      unique.push(pengajuan);
                                    }
                                    return unique;
                                  }, [])
                                : []
                            }
                            renderItem={(pengajuan) => {
                              const vendor = pengajuan.tb_pengajuan_vendors?.[0] || {};
                              const products = orderDetails.tb_transaksi_directs
                                .filter(
                                  item =>
                                    item.tb_pengajuan_transaksi_detail &&
                                    item.tb_pengajuan_transaksi_detail.id_pengajuan === pengajuan.id_pengajuan
                                )
                                .map(item => ({
                                  product_name: item.product_name || 'Produk Tidak Dikenal',
                                  quantity: item.quantity || 0,
                                }));

                              const getStatusColor = (status) => {
                                switch (status?.toUpperCase()) {
                                  case 'APPROVED':
                                    return 'green';
                                  case 'REJECTED':
                                    return 'red';
                                  case 'PENDING':
                                  default:
                                    return 'orange';
                                }
                              };

                              return (
                                <List.Item
                                  className="hover:bg-gray-50 transition-colors rounded-lg"
                                  style={{
                                    padding: '16px',
                                    marginBottom: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                    backgroundColor: '#fafafa'
                                  }}
                                  actions={[
                                    <Link to={`/dashboard/pengajuan/detail/${pengajuan.id_pengajuan}`}>
                                      <Button
                                        icon={<EyeOutlined />}
                                        size="small"
                                        type="primary"
                                        style={{
                                          borderRadius: '6px',
                                          backgroundColor: '#1890ff',
                                          borderColor: '#1890ff',
                                          color: '#fff'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1890ff';
                                          e.currentTarget.style.borderColor = '#1890ff';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1890ff';
                                          e.currentTarget.style.borderColor = '#1890ff';
                                        }}
                                      >
                                        Lihat Detail
                                      </Button>
                                    </Link>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Link to={`/dashboard/pengajuan/detail/${pengajuan.id_pengajuan}`}>
                                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                          {pengajuan.kode_pengajuan || 'Pengajuan'}
                                        </Text>
                                      </Link>
                                    }
                                    description={
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ marginTop: '8px' }}>
                                        <div>
                                          <div style={{ marginBottom: '4px' }}>Tanggal: {pengajuan.tgl_pengajuan ? new Date(pengajuan.tgl_pengajuan).toLocaleDateString('id-ID') : '-'}</div>
                                          <div style={{ marginBottom: '4px' }}>Supplier: {vendor.supplier_name || '-'}</div>
                                          <div style={{ marginBottom: '4px' }}>Total Vendor: Rp {Number(vendor.total_vendor || 0).toLocaleString('id-ID')}</div>
                                          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Status Persetujuan:</div>
                                          <div style={{ marginBottom: '2px' }}>
                                            - Supervisor: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.supervisor_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.supervisor_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                          <div style={{ marginBottom: '2px' }}>
                                            - Accounting: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.accounting_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.accounting_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                          <div>
                                            - Final: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.final_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.final_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Produk:</div>
                                          {products.length > 0 ? (
                                            products.map((product, index) => (
                                              <div key={index} style={{ marginBottom: '2px' }}>
                                                {product.product_name} (Qty: {product.quantity})
                                              </div>
                                            ))
                                          ) : (
                                            <div>Tidak ada produk terkait</div>
                                          )}
                                        </div>
                                      </div>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                            locale={{ emptyText: 'Belum ada pengajuan' }}
                          />
                        </div>
                      ),
                    },
                  ]}
                  style={{ marginTop: '16px' }}
                />
              </div>
            </Card>

            {/* Approval Modal */}
            <Modal
              title={
                <div className="flex items-center space-x-2">
                  <CrownOutlined style={{ color: '#faad14' }} />
                  <span>Konfirmasi Approval</span>
                </div>
              }
              visible={approvalModalVisible}
              onCancel={() => {
                setApprovalModalVisible(false);
                setApprovalKeterangan('');
              }}
              footer={[
                <Button
                  key="cancel"
                  onClick={() => {
                    setApprovalModalVisible(false);
                    setApprovalKeterangan('');
                  }}
                >
                  Batal
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleApproval('rejected')}
                  loading={approvalLoading}
                >
                  Tolak Order
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApproval('approved')}
                  loading={approvalLoading}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Setujui Order
                </Button>,
              ]}
              width={600}
              className="rounded-lg"
            >
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Informasi Order</Text>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Order ID:</strong> {orderDetails?.order_id}</div>
                    <div><strong>Customer:</strong> {orderDetails?.nama_customer}</div>
                    <div><strong>Total:</strong> Rp {Number(orderDetails?.total_tagihan || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>

                <div>
                  <Text strong>Keterangan Approval (Opsional)</Text>
                  <Input.TextArea
                    placeholder="Masukkan keterangan approval..."
                    value={approvalKeterangan}
                    onChange={(e) => setApprovalKeterangan(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    <Text type="warning" className="text-sm">
                      <strong>Perhatian:</strong> Tindakan ini akan mengubah status approval order secara permanen.
                    </Text>
                  </div>
                </div>
              </div>
            </Modal>
          </Card>
        </div>
      </>
    );
  } else {
    const orderId = orderDetails.order_id || orderDetails.transaksi_details?.[0]?.order_id || '';
    return (
      <>
        <style>{responsiveStyles}</style>
        {/* Flower Petals Animation */}
        <div className="flower-petals">
          {[10, 25, 40, 55, 70, 15, 30, 45, 60, 80].map((left, i) => (
            <div
              key={i}
              className="flower-petal"
              style={{
                left: `${left}%`,
                top: '100vh',
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${10 + (i % 4) * 2}s`,
              }}
            />
          ))}
        </div>
        <div className="w-full max-w-none px-0 sm:px-0" style={{ position: 'relative', zIndex: 1 }}>
          <Card
            className="w-full max-w-none rounded-2xl shadow-lg border border-gray-100 bg-white px-0 sm:px-8 py-8 fade-in-up flower-bg"
            style={{
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(255, 182, 193, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 182, 193, 0.15)',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.95) 100%)',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              zIndex: 1
            }}
          >
            {/* Approval Status Card */}
            <ApprovalStatusCard
              status={approvalStatus || 'pending'}
              canApprove={userRole?.id_role === 4 && userRole?.role === 'supervisor'}
              onApproveClick={handleApprovalClick}
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 fade-in-up" style={{ animationDelay: '0.1s', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="icon-wrapper-blue">
                  <ShoppingOutlined style={{ fontSize: '20px' }} />
                </div>
                <div>
                  <Title level={2} className="font-bold mb-1 tracking-tight gradient-header" style={{ fontWeight: 700, marginBottom: '4px' }}>Detail Order</Title>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="decorative-badge">Order Management</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-base font-medium">{orderDetails?.order_id || ''}</div>
                <div className="text-gray-400 text-sm">Tanggal: {orderDetails?.created_date} {orderDetails?.created_time}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                {contextHolder}
                <Button icon={<RollbackOutlined />} onClick={handleBackToList} className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100">Kembali</Button>
                <Tooltip title={approvalStatus !== 'approved' ? 'Order harus disetujui terlebih dahulu' : ''}>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={handleSelectProduct}
                    className="rounded-lg px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    disabled={approvalStatus !== 'approved'}
                    style={approvalStatus !== 'approved' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Select Product
                  </Button>
                </Tooltip>
                <Tooltip title={approvalStatus !== 'approved' ? 'Order harus disetujui terlebih dahulu' : ''}>
                  <Link to={approvalStatus === 'approved' ? `/dashboard/pengajuan/add/${orderDetails.id_data}` : '#'}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="rounded-lg px-4 py-2 bg-green-500 border-green-500 text-white hover:bg-green-600"
                      disabled={approvalStatus !== 'approved'}
                      style={approvalStatus !== 'approved' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      Pengajuan
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip title={orderDetails.tb_delivery_orders?.length > 0 ? 'Order tidak dapat diedit karena sudah ada delivery order' : isAccounting ? 'Aksi tidak tersedia untuk role accounting' : isPartnership ? 'Aksi tidak tersedia untuk role partnership' : userRole?.id_user === 44 ? 'Tidak diperkenankan mengedit order' : ''}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleButtonEdit}
                    className="rounded-lg px-4 py-2 bg-orange-500 border-orange-500 text-white hover:bg-orange-600"
                    disabled={orderDetails.tb_delivery_orders?.length > 0 || isAccounting || isPartnership || userRole?.id_user === 44}
                    style={orderDetails.tb_delivery_orders?.length > 0 || isAccounting || isPartnership || userRole?.id_user === 44 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Edit Order
                  </Button>
                </Tooltip>
                <Button type="primary" icon={<PrinterOutlined />} className="rounded-lg px-4 py-2 bg-blue-500 border-blue-500 text-white hover:bg-blue-600" onClick={handlePrintInvoice}>Print</Button>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="space-y-2">
                <div className="text-gray-600 font-semibold text-base">Informasi Order</div>
                <div className="text-gray-800 text-sm">Order ID: <span className="font-medium">{orderDetails?.order_id}</span></div>
                <div className="text-gray-800 text-sm">Tanggal: <span className="font-medium">{orderDetails?.created_date} {orderDetails?.created_time}</span></div>
                {orderDetails?.no_referensi && (
                  <div className="text-gray-800 text-sm">No Referensi: <span className="font-medium">{orderDetails?.no_referensi}</span></div>
                )}
                <div><Tag color={getStatusColor(orderDetails?.status_transaksi)}>{orderDetails?.status_transaksi}</Tag></div>
              </div>
              <div className="space-y-2 border-l border-gray-100 pl-6">
                <div className="text-gray-600 font-semibold text-base">Informasi Pelanggan</div>
                <div className="text-gray-800 text-sm">Nama: <span className="font-medium">{orderDetails?.nama_customer || '-'}</span></div>
                <div className="text-gray-800 text-sm">Penerima: <span className="font-medium">{orderDetails?.nama_penerima || '-'}</span></div>
                <div className="text-gray-800 text-sm">Telepon: <span className="font-medium">{orderDetails?.telp_penerima || '-'}</span></div>
              </div>
              <div className="space-y-2 border-l border-gray-100 pl-6">
                <div className="text-gray-600 font-semibold text-base">Informasi Pengiriman</div>
                <div className="text-gray-800 text-sm">Alamat: <span className="font-medium">{orderDetails?.alamat_pengiriman}</span></div>
                <div className="text-gray-800 text-sm">Kurir: <span className="font-medium">{orderDetails?.pengiriman || orderDetails?.transaksi_details?.[0]?.expedisi || '-'}</span></div>
              </div>
            </div>

            {/* Produk Section */}
            <div className="mb-8">
              <Title level={4} className="mb-3 font-semibold text-gray-900">Daftar Produk</Title>
              <Card className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <Table
                  dataSource={orderDetails?.transaksi_details || []}
                  columns={columns}
                  rowKey="id_detail"
                  pagination={false}
                  scroll={{ x: true }}
                  className="mb-2"
                />
              </Card>
            </div>

            {/* Keterangan & Pembayaran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="text-gray-600 font-semibold">Keterangan:</div>
                <div className="text-gray-500 italic text-sm bg-gray-50 rounded-lg p-3">
                  {breakTextIntoLines(orderDetails?.pesan_customer).map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="text-gray-600 font-semibold">Catatan Package:</div>
                <div className="text-gray-500 italic text-sm bg-gray-50 rounded-lg p-3">
                  {breakTextIntoLines(orderDetails?.pesan_package).map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </div>
              <div>
                <Title level={5} className="mb-3 font-semibold text-gray-900">Informasi Pembayaran</Title>
                <Card className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <Descriptions layout="vertical" bordered column={1}>
                    <Descriptions.Item label="Metode Pembayaran">{orderDetails?.metode_pembayaran || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Status Pembayaran">
                      <Tag color={getStatusColor(orderDetails?.status_transaksi)}>{orderDetails?.status_transaksi}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Biaya Total">Rp {Number(orderDetails?.total_tagihan || 0).toLocaleString('id-ID')}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            </div>

            {/* Modern Tab Section */}
            <Card className="mt-6 fade-in-up decorative-card flower-bg" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <Tabs
                  activeKey={activeTab}
                  onChange={(key) => {
                    setActiveTab(key);
                    if (key === 'history') fetchHistory();
                  }}
                  items={[
                    {
                      key: 'lampiran',
                      label: (
                        <span className="flex items-center gap-2">
                          <FileTextOutlined />
                          Lampiran
                          {attachments.length > 0 && (
                            <Badge count={attachments.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <div className="flex justify-between items-center mb-4">
                            <Title level={5} className="m-0" style={{ fontWeight: 600 }}>Lampiran</Title>
                            <Tooltip title={isAccounting ? 'Aksi tidak tersedia untuk role accounting' : isPartnership ? 'Aksi tidak tersedia untuk role partnership' : userRole?.id_user === 44 ? 'Tidak diperkenankan mengunggah lampiran' : ''}>
                              <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={() => { if (!isAccounting && userRole?.id_user !== 44 && !isPartnership) setIsModalVisible(true); }}
                                style={{
                                  borderRadius: '8px',
                                  backgroundColor: '#1890ff',
                                  borderColor: '#1890ff',
                                  color: '#fff'
                                }}
                                disabled={isAccounting || userRole?.id_user === 44 || isPartnership}
                                className={isAccounting || userRole?.id_user === 44 || isPartnership ? 'opacity-50 cursor-not-allowed' : ''}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1890ff';
                                  e.currentTarget.style.borderColor = '#1890ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1890ff';
                                  e.currentTarget.style.borderColor = '#1890ff';
                                }}
                              >
                                Unggah Lampiran
                              </Button>
                            </Tooltip>
                          </div>
                          <Modal
                            title="Unggah Lampiran"
                            visible={isModalVisible}
                            onCancel={() => { setIsModalVisible(false); setKeterangan(''); setTempFile(null); }}
                            footer={[
                              <Button key="cancel" onClick={() => { setIsModalVisible(false); setKeterangan(''); setTempFile(null); }}>Cancel</Button>,
                              <Button
                                key="submit"
                                type="primary"
                                loading={isUploading}
                                onClick={() => tempFile && handleUploadAttachment({ file: tempFile, onSuccess: () => setIsModalVisible(false), onError: () => { } })}
                                disabled={!tempFile || isUploading}
                              >
                                OK
                              </Button>,
                            ]}
                            width="90%"
                          >
                            <div className="mb-3">
                              <Text strong>Keterangan:</Text>
                              <Input
                                placeholder="Masukkan keterangan"
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                style={{ width: '100%', marginTop: '8px' }}
                              />
                            </div>
                            <Upload
                              customRequest={({ file }) => setTempFile(file)}
                              showUploadList={true}
                              fileList={tempFile ? [{ uid: '-1', name: tempFile.name, status: 'done' }] : []}
                              accept=".jpg,.jpeg,.png,.pdf"
                              onRemove={() => setTempFile(null)}
                            >
                              <Button icon={<UploadOutlined />}>Pilih File</Button>
                            </Upload>
                          </Modal>
                          <List
                            loading={attachmentLoading}
                            dataSource={attachments}
                            renderItem={(item) => (
                              <List.Item
                                className="hover:bg-gray-50 transition-colors rounded-lg"
                                style={{
                                  padding: '12px',
                                  marginBottom: '8px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 0, 0, 0.06)'
                                }}
                                actions={[
                                  <Button
                                    icon={<EyeOutlined />}
                                    onClick={() => handlePreview(item.url, item.nama_file)}
                                    size="small"
                                    style={{ borderRadius: '6px' }}
                                  >
                                    Preview
                                  </Button>,
                                  <Button
                                    icon={<DownloadOutlined />}
                                    onClick={() => handleDownload(item.url, item.nama_file)}
                                    size="small"
                                    style={{ borderRadius: '6px' }}
                                  >
                                    Download
                                  </Button>,
                                  <Button
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteAttachment(item.id_lampiran)}
                                    danger
                                    size="small"
                                    style={{ borderRadius: '6px' }}
                                  >
                                    Hapus
                                  </Button>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#1890ff', fontWeight: 500 }}
                                    >
                                      {item.nama_file}
                                    </a>
                                  }
                                  description={
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      <div>Diunggah: {item.date_added ? new Date(item.date_added).toLocaleString('id-ID') : 'Tanggal'}</div>
                                      <div>Keterangan: {item.keterangan || 'Tidak ada'}</div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: 'Belum ada lampiran' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'history',
                      label: (
                        <span className="flex items-center gap-2">
                          <CommentOutlined />
                          History
                          {historyData.length > 0 && (
                            <Badge count={historyData.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Riwayat</Title>
                          <div className="flex gap-2 mb-4">
                            <Input
                              placeholder="Add comment manual for this SO..."
                              value={historyComment}
                              onChange={(e) => setHistoryComment(e.target.value)}
                            />
                            <Button
                              type="primary"
                              loading={submittingHistory}
                              onClick={handleSubmitHistoryComment}
                            >
                              Add Comment
                            </Button>
                          </div>
                          <Table
                            loading={historyLoading}
                            dataSource={historyData}
                            columns={historyColumns}
                            pagination={{ pageSize: 5, size: 'small' }}
                            rowKey={(record) => record.id_transaksi_history || record.tgl}
                            size="small"
                            className="ant-table-custom"
                            locale={{ emptyText: 'Belum ada riwayat' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'delivery-order',
                      label: (
                        <span className="flex items-center gap-2">
                          <TruckOutlined />
                          Delivery Order
                          {orderDetails.tb_delivery_orders?.length > 0 && (
                            <Badge count={orderDetails.tb_delivery_orders.length} size="small" />
                          )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Daftar Delivery Order</Title>
                          <List
                            dataSource={orderDetails.tb_delivery_orders || []}
                            renderItem={(item) => (
                              <List.Item
                                className="hover:bg-gray-50 transition-colors rounded-lg"
                                style={{
                                  padding: '16px',
                                  marginBottom: '12px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(0, 0, 0, 0.06)',
                                  backgroundColor: '#fafafa'
                                }}
                                actions={[
                                  <Link to={`/dashboard/delivery-order/detail/${item.id_delivery_order}`}>
                                    <Button
                                      icon={<EyeOutlined />}
                                      size="small"
                                      type="primary"
                                      style={{
                                        borderRadius: '6px',
                                        backgroundColor: '#1890ff',
                                        borderColor: '#1890ff',
                                        color: '#fff'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1890ff';
                                        e.currentTarget.style.borderColor = '#1890ff';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1890ff';
                                        e.currentTarget.style.borderColor = '#1890ff';
                                      }}
                                    >
                                      Lihat Detail
                                    </Button>
                                  </Link>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={<Text strong style={{ fontSize: '16px' }}>{item.code_delivery_order || 'DO'}</Text>}
                                  description={
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ marginTop: '8px' }}>
                                      <div>
                                        <div style={{ marginBottom: '4px' }}>Tanggal: {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString('id-ID') : '-'}</div>
                                        <div>Tracking: {item.tracking_no || '-'}</div>
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Produk:</div>
                                        {item.tb_delivery_order_details?.map((detail, index) => {
                                          const product = orderDetails.tb_transaksi_directs?.find(
                                            (trans) => trans.product_id === detail.product_id
                                          ) || orderDetails.transaksi_details?.find(
                                            (trans) => trans.id_detail === detail.product_id
                                          );
                                          const productName = product ? (product.product_name || product.nama_produk) : 'Produk Tidak Dikenal';
                                          return (
                                            <div key={index} style={{ marginBottom: '2px' }}>
                                              {productName} (Qty: {detail.quantity})
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: 'Belum ada delivery order' }}
                          />
                        </div>
                      ),
                    },
                    {
                      key: 'pengajuan',
                      label: (
                        <span className="flex items-center gap-2">
                          <FileTextOutlined />
                          Pengajuan
                          {(orderDetails.tb_transaksi_directs || orderDetails.transaksi_details)?.filter(
                            item =>
                              item.tb_pengajuan_transaksi_detail &&
                              item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                              item.tb_pengajuan_transaksi_detail.id_pengajuan
                          ).length > 0 && (
                              <Badge
                                count={
                                  (orderDetails.tb_transaksi_directs || orderDetails.transaksi_details)
                                    .filter(
                                      item =>
                                        item.tb_pengajuan_transaksi_detail &&
                                        item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                                        item.tb_pengajuan_transaksi_detail.id_pengajuan
                                    )
                                    .reduce((unique, item) => {
                                      const pengajuan = item.tb_pengajuan_transaksi_detail.tb_pengajuan;
                                      if (pengajuan && !unique.some(u => u.id_pengajuan === pengajuan.id_pengajuan)) {
                                        unique.push(pengajuan);
                                      }
                                      return unique;
                                    }, []).length
                                }
                                size="small"
                              />
                            )}
                        </span>
                      ),
                      children: (
                        <div className="fade-in">
                          <Title level={5} className="mb-4" style={{ fontWeight: 600 }}>Daftar Pengajuan</Title>
                          <List
                            dataSource={
                              (orderDetails.tb_transaksi_directs || orderDetails.transaksi_details)
                                ? (orderDetails.tb_transaksi_directs || orderDetails.transaksi_details)
                                  .filter(
                                    item =>
                                      item.tb_pengajuan_transaksi_detail &&
                                      item.tb_pengajuan_transaksi_detail.tb_pengajuan &&
                                      item.tb_pengajuan_transaksi_detail.id_pengajuan
                                  )
                                  .reduce((unique, item) => {
                                    const pengajuan = item.tb_pengajuan_transaksi_detail.tb_pengajuan;
                                    if (pengajuan && !unique.some(u => u.id_pengajuan === pengajuan.id_pengajuan)) {
                                      unique.push(pengajuan);
                                    }
                                    return unique;
                                  }, [])
                                : []
                            }
                            renderItem={(pengajuan) => {
                              const vendor = pengajuan.tb_pengajuan_vendors?.[0] || {};
                              const products = (orderDetails.tb_transaksi_directs || orderDetails.transaksi_details)
                                .filter(
                                  item =>
                                    item.tb_pengajuan_transaksi_detail &&
                                    item.tb_pengajuan_transaksi_detail.id_pengajuan === pengajuan.id_pengajuan
                                )
                                .map(item => ({
                                  product_name: item.product_name || item.nama_produk || 'Produk Tidak Dikenal',
                                  quantity: item.quantity || item.qty || 0,
                                }));

                              const getStatusColor = (status) => {
                                switch (status?.toUpperCase()) {
                                  case 'APPROVED':
                                    return 'green';
                                  case 'REJECTED':
                                    return 'red';
                                  case 'PENDING':
                                  default:
                                    return 'orange';
                                }
                              };

                              return (
                                <List.Item
                                  className="hover:bg-gray-50 transition-colors rounded-lg"
                                  style={{
                                    padding: '16px',
                                    marginBottom: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0, 0, 0, 0.06)',
                                    backgroundColor: '#fafafa'
                                  }}
                                  actions={[
                                    <Link to={`/dashboard/pengajuan/detail/${pengajuan.id_pengajuan}`}>
                                      <Button
                                        icon={<EyeOutlined />}
                                        size="small"
                                        type="primary"
                                        style={{
                                          borderRadius: '6px',
                                          backgroundColor: '#1890ff',
                                          borderColor: '#1890ff',
                                          color: '#fff'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1890ff';
                                          e.currentTarget.style.borderColor = '#1890ff';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#1890ff';
                                          e.currentTarget.style.borderColor = '#1890ff';
                                        }}
                                      >
                                        Lihat Detail
                                      </Button>
                                    </Link>,
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Link to={`/dashboard/pengajuan/detail/${pengajuan.id_pengajuan}`}>
                                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                          {pengajuan.kode_pengajuan || 'Pengajuan'}
                                        </Text>
                                      </Link>
                                    }
                                    description={
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" style={{ marginTop: '8px' }}>
                                        <div>
                                          <div style={{ marginBottom: '4px' }}>Tanggal: {pengajuan.tgl_pengajuan ? new Date(pengajuan.tgl_pengajuan).toLocaleDateString('id-ID') : '-'}</div>
                                          <div style={{ marginBottom: '4px' }}>Supplier: {vendor.supplier_name || '-'}</div>
                                          <div style={{ marginBottom: '4px' }}>Total Vendor: Rp {Number(vendor.total_vendor || 0).toLocaleString('id-ID')}</div>
                                          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Status Persetujuan:</div>
                                          <div style={{ marginBottom: '2px' }}>
                                            - Supervisor: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.supervisor_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.supervisor_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                          <div style={{ marginBottom: '2px' }}>
                                            - Accounting: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.accounting_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.accounting_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                          <div>
                                            - Final: <Tag color={getStatusColor(pengajuan.tb_pengajuan_approve?.final_approval)}>
                                              {pengajuan.tb_pengajuan_approve?.final_approval?.toUpperCase() || 'PENDING'}
                                            </Tag>
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Produk:</div>
                                          {products.length > 0 ? (
                                            products.map((product, index) => (
                                              <div key={index} style={{ marginBottom: '2px' }}>
                                                {product.product_name} (Qty: {product.quantity})
                                              </div>
                                            ))
                                          ) : (
                                            <div>Tidak ada produk terkait</div>
                                          )}
                                        </div>
                                      </div>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                            locale={{ emptyText: 'Belum ada pengajuan' }}
                          />
                        </div>
                      ),
                    },
                  ]}
                  style={{ marginTop: '16px' }}
                />
              </div>
            </Card>

            {/* Approval Modal */}
            <Modal
              title={
                <div className="flex items-center space-x-2">
                  <CrownOutlined style={{ color: '#faad14' }} />
                  <span>Konfirmasi Approval</span>
                </div>
              }
              visible={approvalModalVisible}
              onCancel={() => {
                setApprovalModalVisible(false);
                setApprovalKeterangan('');
              }}
              footer={[
                <Button
                  key="cancel"
                  onClick={() => {
                    setApprovalModalVisible(false);
                    setApprovalKeterangan('');
                  }}
                >
                  Batal
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleApproval('rejected')}
                  loading={approvalLoading}
                >
                  Tolak Order
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApproval('approved')}
                  loading={approvalLoading}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Setujui Order
                </Button>,
              ]}
              width={600}
              className="rounded-lg"
            >
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Informasi Order</Text>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><strong>Order ID:</strong> {orderDetails?.order_id}</div>
                    <div><strong>Customer:</strong> {orderDetails?.nama_customer}</div>
                    <div><strong>Total:</strong> Rp {Number(orderDetails?.total_tagihan || 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>

                <div>
                  <Text strong>Keterangan Approval (Opsional)</Text>
                  <Input.TextArea
                    placeholder="Masukkan keterangan approval..."
                    value={approvalKeterangan}
                    onChange={(e) => setApprovalKeterangan(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    <Text type="warning" className="text-sm">
                      <strong>Perhatian:</strong> Tindakan ini akan mengubah status approval order secara permanen.
                    </Text>
                  </div>
                </div>
              </div>
            </Modal>
          </Card>
        </div>
      </>
    );
  }
};

export default OrderDetailPage;

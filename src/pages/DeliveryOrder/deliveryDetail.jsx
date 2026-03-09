import LogoJaja from '../../assets/LogoJaja.png';
import JajaAuto from '../../assets/JajaAuto.png';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  Table,
  Tag,
  Button,
  Divider,
  Typography,
  Space,
  Modal,
  notification,
  Spin,
  Select,
  Upload,
  List,
  Input,
  Checkbox,
} from 'antd';
import {
  PrinterOutlined,
  RollbackOutlined,
  FileTextOutlined,
  FileAddOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import * as jwt_decode from 'jwt-decode';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;
const { Option } = Select;

const responsiveStyles = `
  /* Modern Design Styles */
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

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
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

  @keyframes petalFall {
    0% {
      transform: translateY(-100vh) rotate(0deg) scale(0.5);
      opacity: 0;
    }
    10% {
      opacity: 0.8;
    }
    50% {
      transform: translateY(50vh) rotate(180deg) scale(1);
      opacity: 0.9;
    }
    90% {
      opacity: 0.8;
    }
    100% {
      transform: translateY(100vh) rotate(360deg) scale(0.5);
      opacity: 0;
    }
  }

  @keyframes floatBubble {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
      opacity: 0.3;
    }
    33% {
      transform: translateY(-30px) translateX(20px);
      opacity: 0.5;
    }
    66% {
      transform: translateY(-60px) translateX(-20px);
      opacity: 0.4;
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

  @keyframes gentleFloat {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(5deg);
    }
  }

  @keyframes rotateSlow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .delivery-detail-container {
    position: relative;
    min-height: 100vh;
    animation: fadeInUp 0.6s ease-out;
  }

  .delivery-detail-container::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(139, 195, 74, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(76, 175, 80, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(129, 199, 132, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 60% 20%, rgba(139, 195, 74, 0.05) 0%, transparent 50%);
    animation: float 20s ease-in-out infinite;
  }

  .floral-decoration {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .petal {
    position: absolute;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, rgba(139, 195, 74, 0.4) 0%, rgba(76, 175, 80, 0.3) 50%, rgba(129, 199, 132, 0.2) 100%);
    border-radius: 50% 0 50% 0;
    animation: petalFall linear infinite;
    box-shadow: 0 2px 8px rgba(139, 195, 74, 0.2);
    opacity: 0;
  }

  .petal::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    top: 3px;
    left: 3px;
  }

  .petal:nth-child(1) { left: 5%; animation-duration: 12s; animation-delay: 0s; width: 18px; height: 18px; }
  .petal:nth-child(2) { left: 15%; animation-duration: 15s; animation-delay: 1.5s; width: 22px; height: 22px; }
  .petal:nth-child(3) { left: 25%; animation-duration: 18s; animation-delay: 3s; width: 16px; height: 16px; }
  .petal:nth-child(4) { left: 75%; animation-duration: 14s; animation-delay: 0.5s; width: 20px; height: 20px; }
  .petal:nth-child(5) { left: 85%; animation-duration: 16s; animation-delay: 2.5s; width: 24px; height: 24px; }
  .petal:nth-child(6) { left: 95%; animation-duration: 13s; animation-delay: 4s; width: 18px; height: 18px; }
  .petal:nth-child(7) { left: 50%; animation-duration: 17s; animation-delay: 1s; width: 20px; height: 20px; }
  .petal:nth-child(8) { left: 60%; animation-duration: 19s; animation-delay: 2s; width: 16px; height: 16px; }
  .petal:nth-child(9) { left: 40%; animation-duration: 15s; animation-delay: 0.8s; width: 22px; height: 22px; }
  .petal:nth-child(10) { left: 35%; animation-duration: 20s; animation-delay: 3.5s; width: 18px; height: 18px; }

  .floating-bubble {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 195, 74, 0.15) 0%, rgba(76, 175, 80, 0.05) 100%);
    pointer-events: none;
    animation: floatBubble ease-in-out infinite;
  }

  .floating-bubble:nth-child(11) {
    width: 120px;
    height: 120px;
    top: 10%;
    left: 5%;
    animation-duration: 8s;
    filter: blur(20px);
  }

  .floating-bubble:nth-child(12) {
    width: 80px;
    height: 80px;
    top: 60%;
    right: 10%;
    animation-duration: 10s;
    animation-delay: 2s;
    filter: blur(15px);
  }

  .floating-bubble:nth-child(13) {
    width: 100px;
    height: 100px;
    bottom: 20%;
    left: 15%;
    animation-duration: 12s;
    animation-delay: 1s;
    filter: blur(18px);
  }

  .sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: rgba(139, 195, 74, 0.8);
    border-radius: 50%;
    animation: sparkle 2s ease-in-out infinite;
    pointer-events: none;
  }

  .sparkle:nth-child(14) { top: 20%; left: 30%; animation-delay: 0s; }
  .sparkle:nth-child(15) { top: 50%; left: 70%; animation-delay: 0.5s; }
  .sparkle:nth-child(16) { top: 80%; left: 20%; animation-delay: 1s; }
  .sparkle:nth-child(17) { top: 30%; right: 25%; animation-delay: 1.5s; }
  .sparkle:nth-child(18) { bottom: 15%; right: 15%; animation-delay: 0.3s; }

  .decorative-corner {
    position: absolute;
    width: 150px;
    height: 150px;
    pointer-events: none;
    z-index: 0;
  }

  .decorative-corner.top-left {
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(139, 195, 74, 0.1) 0%, transparent 70%);
    border-radius: 0 0 100% 0;
    animation: gentleFloat 6s ease-in-out infinite;
  }

  .decorative-corner.top-right {
    top: 0;
    right: 0;
    background: radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%);
    border-radius: 0 0 0 100%;
    animation: gentleFloat 8s ease-in-out infinite;
    animation-delay: 1s;
  }

  .decorative-corner.bottom-left {
    bottom: 0;
    left: 0;
    background: radial-gradient(circle, rgba(129, 199, 132, 0.1) 0%, transparent 70%);
    border-radius: 0 100% 0 0;
    animation: gentleFloat 7s ease-in-out infinite;
    animation-delay: 0.5s;
  }

  .decorative-corner.bottom-right {
    bottom: 0;
    right: 0;
    background: radial-gradient(circle, rgba(139, 195, 74, 0.1) 0%, transparent 70%);
    border-radius: 100% 0 0 0;
    animation: gentleFloat 9s ease-in-out infinite;
    animation-delay: 1.5s;
  }

  .modern-card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    z-index: 1;
    overflow: hidden;
  }

  .modern-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    opacity: 0.6;
    animation: shimmer 3s linear infinite;
  }

  .modern-card::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(139, 195, 74, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    animation: rotateSlow 20s linear infinite;
    pointer-events: none;
  }

  .modern-card:hover {
    box-shadow: 0 8px 32px rgba(139, 195, 74, 0.15), 0 4px 16px rgba(76, 175, 80, 0.1);
    transform: translateY(-2px);
  }

  .modern-card:hover::after {
    animation: rotateSlow 10s linear infinite;
  }

  .section-header {
    background: linear-gradient(135deg, rgba(139, 195, 74, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%);
    padding: 20px 24px;
    border-radius: 16px;
    margin-bottom: 24px;
    border-left: 4px solid #8bc34a;
    animation: fadeInUp 0.5s ease-out;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .section-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(139, 195, 74, 0.05) 0%, transparent 50%);
    animation: rotateSlow 15s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .section-header > * {
    position: relative;
    z-index: 1;
  }

  .info-card {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    animation: fadeInUp 0.6s ease-out;
    position: relative;
    overflow: hidden;
  }

  .info-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(139, 195, 74, 0.05), transparent);
    transition: left 0.5s ease;
  }

  .info-card:hover {
    border-color: rgba(139, 195, 74, 0.2);
    box-shadow: 0 4px 16px rgba(139, 195, 74, 0.08);
    transform: translateY(-1px);
  }

  .info-card:hover::before {
    left: 100%;
  }

  .summary-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    padding: 24px;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    animation: fadeInUp 0.7s ease-out;
  }

  .modern-button {
    border-radius: 12px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .modern-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .modern-button:active {
    transform: translateY(0);
  }

  /* Flat blue button without hover/transform changes (used for 'Unggah') - global */
  .flat-blue-btn {
    background-color: #007bff !important;
    border-color: #007bff !important;
    color: #fff !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .flat-blue-btn:hover,
  .flat-blue-btn:active,
  .flat-blue-btn:focus {
    background-color: #007bff !important;
    border-color: #007bff !important;
    color: #fff !important;
    box-shadow: none !important;
    transform: none !important;
  }

  /* Softer button colors to reduce eye strain */
  .btn-soft-blue {
    background-color: #2b6ea3 !important; /* muted blue */
    border-color: #2b6ea3 !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }
  .btn-soft-blue:hover,
  .btn-soft-blue:active,
  .btn-soft-blue:focus {
    background-color: #2b6ea3 !important;
    border-color: #2b6ea3 !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }

  .btn-soft-red {
    background-color: #b91c1c !important; /* muted/darker red */
    border-color: #b91c1c !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }
  .btn-soft-red:hover,
  .btn-soft-red:active,
  .btn-soft-red:focus {
    background-color: #b91c1c !important;
    border-color: #b91c1c !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }

  /* Outline button styles with colored border and subtle hover */
  .outline-btn {
    background: transparent !important;
    box-shadow: none !important;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .outline-blue {
    border: 1.5px solid #2b6ea3 !important;
    color: #2b6ea3 !important;
  }
  .outline-blue:hover,
  .outline-blue:focus {
    background-color: rgba(43,110,163,0.06) !important;
    border-color: #2b6ea3 !important;
    color: #2b6ea3 !important;
  }
  .outline-red {
    border: 1.5px solid #b91c1c !important;
    color: #b91c1c !important;
  }
  .outline-red:hover,
  .outline-red:focus {
    background-color: rgba(185,28,28,0.06) !important;
    border-color: #b91c1c !important;
    color: #b91c1c !important;
  }

  .table-modern {
    border-radius: 12px;
    overflow: hidden;
    animation: fadeInUp 0.8s ease-out;
  }

  .table-modern .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
    border-bottom: 2px solid rgba(139, 195, 74, 0.2);
    font-weight: 600;
    color: #2c3e50;
  }

  .table-modern .ant-table-tbody > tr {
    transition: all 0.2s ease;
  }

  .table-modern .ant-table-tbody > tr:hover {
    background: rgba(139, 195, 74, 0.04);
    transform: scale(1.01);
  }

  .attachment-item {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.5s ease-out;
  }

  .attachment-item:hover {
    border-color: rgba(139, 195, 74, 0.3);
    box-shadow: 0 4px 16px rgba(139, 195, 74, 0.1);
    transform: translateX(4px);
  }

  .status-badge {
    animation: fadeInUp 0.5s ease-out;
    transition: all 0.3s ease;
  }

  .status-badge:hover {
    transform: scale(1.05);
  }

  /* Base styles for larger screens */
  .mobile-responsive {
    padding: 16px;
  }

  .mobile-responsive .ant-table {
    width: 100%;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .delivery-detail-container {
      padding: 12px;
    }

    .mobile-responsive {
      padding: 8px;
    }

    .mobile-responsive .ant-typography {
      font-size: 18px !important;
      margin-bottom: 8px;
    }

    .mobile-responsive .ant-card {
      margin: 0 4px;
      padding: 8px !important;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    }

    .mobile-responsive .ant-card-body {
      padding: 12px !important;
    }

    .section-header {
      padding: 16px;
      border-radius: 12px;
    }

    .info-card, .summary-card {
      padding: 16px;
      border-radius: 12px;
    }

    /* Table responsiveness */
    .mobile-responsive .ant-table {
      overflow-x: auto;
      font-size: 13px !important;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 12px;
      padding: 8px 10px;
      background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
      white-space: nowrap;
    }

    .mobile-responsive .ant-table-tbody > tr {
      border-bottom: 1px solid #e8e8e8;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      padding: 8px 10px;
      font-size: 13px;
      border: none;
    }

    /* Ensure table doesn't break layout */
    .mobile-responsive .ant-table-content {
      min-width: 100%;
      overflow-x: auto;
    }

    /* Buttons */
    .mobile-responsive .ant-btn {
      width: 100%;
      margin-bottom: 8px;
      font-size: 13px;
      padding: 8px;
      height: auto;
      border-radius: 10px;
    }

    /* flat-blue-btn removed from mobile-only block — styles moved to global scope */

    .mobile-responsive .ant-space {
      flex-direction: column;
      width: 100%;
    }

    /* Grid layout */
    .mobile-responsive .grid-cols-2 {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  @media (max-width: 480px) {
    .mobile-responsive .ant-typography {
      font-size: 16px !important;
    }

    .mobile-responsive .ant-table-thead > tr > th {
      font-size: 11px;
      padding: 6px 8px;
    }

    .mobile-responsive .ant-table-tbody > tr > td {
      font-size: 12px;
      padding: 6px 8px;
    }

    .mobile-responsive .ant-btn {
      font-size: 12px;
      padding: 6px;
    }
  }
`;

const DeliveryOrderPage = () => {
  const navigate = useNavigate();
  const { id_delivery_order } = useParams();
  const { state } = useLocation();
  const [remainingQty, setRemainingQty] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isShipped, setIsShipped] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [isModalVisibleLampiran, setIsModalVisibleLampiran] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [tempFile, setTempFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null); // 'approved', 'rejected', or null
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  // State untuk modal preview image
  const [previewImage, setPreviewImage] = useState({ visible: false, url: '', fileName: '' });
  const [zoomLevel, setZoomLevel] = useState(0); // 0: normal, 1: zoom1, 2: zoom2

  // Invoice Creation Modal State
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]); // [{ id_delivery_order_detail, is_taxable }]

  // Comment History State
  const [historyKomentar, setHistoryKomentar] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newKomentar, setNewKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);


  // Get user role from token (run once on mount)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const rawToken = token.startsWith('') ? token.slice(7) : token;
        const payload = JSON.parse(atob(rawToken.split('.')[1]));
        // Support multiple possible id fields from different token formats
        const resolvedUserId = payload.id_user ?? payload.userId ?? payload.user_id ?? null;
        setUserId(resolvedUserId);
        // Normalize role to lowercase string when present
        const resolvedRole = typeof payload.role === 'string' ? payload.role.toLowerCase() : null;
        setUserRole(resolvedRole);
        // DEBUG - show parsed values in console to help troubleshooting
        console.log('DeliveryDetail - parsed token:', { resolvedUserId, resolvedRole });
      } catch (e) {
        console.log('JWT DECODE ERROR:', e);
        setUserId(null);
        setUserRole(null);
      }
    }
  }, []);

  // Ambil approval_status langsung dari detail delivery order
  useEffect(() => {
    if (orderDetails && typeof orderDetails.approval_status !== 'undefined') {
      setApprovalStatus(orderDetails.approval_status);
    }
  }, [orderDetails]);

  // Fetch history komentar
  const fetchHistory = async () => {
    if (!id_delivery_order) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${baseUrl}/nimda/delivery-order/history/${id_delivery_order}`,
        {
          headers: {
            Authorization: token && token.startsWith('Bearer ') ? token : `${token}`
          },
        }
      );
      if (response.data.status === 200) {
        setHistoryKomentar(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitKomentar = async () => {
    if (!newKomentar.trim()) return;
    setIsSubmittingKomentar(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        method: 'post', // Changed from 'get' to 'post' as requested
        url: `${baseUrl}/nimda/delivery-order/history`, // Updated endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token && token.startsWith('Bearer ') ? token : `${token}`
        },
        data: JSON.stringify({
          "id_delivery_order": parseInt(id_delivery_order),
          "komentar": newKomentar
        })
      };

      const response = await axios.request(config);

      if (response.data.status === 201 || response.data.success) {
        notification.success({
          message: 'Sukses',
          description: response.data.message || 'Komentar berhasil ditambahkan'
        });
        setNewKomentar('');
        fetchHistory();
      } else {
        throw new Error(response.data.message || 'Gagal menambahkan komentar');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      notification.error({
        message: 'Gagal',
        description: error.response?.data?.message || error.message || 'Terjadi kesalahan saat menambahkan komentar'
      });
    } finally {
      setIsSubmittingKomentar(false);
    }
  };

  useEffect(() => {
    if (id_delivery_order) {
      fetchHistory();
    }
  }, [id_delivery_order]);

  useEffect(() => {
    const fetchDeliveryOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const deliveryResponse = await axios.get(
          `${baseUrl}/nimda/delivery-order/${id_delivery_order}/detail`,
          {
            headers: { Authorization: `${token}` },
          }
        );

        if (!deliveryResponse.data.success) {
          throw new Error(deliveryResponse.data.message || 'Failed to fetch delivery order');
        }

        const deliveryData = deliveryResponse.data.data?.delivery_order;
        if (!deliveryData) {
          throw new Error('Delivery order data is missing in the response');
        }

        const doDetails = Array.isArray(deliveryData.do_details) ? deliveryData.do_details : [];
        if (doDetails.length === 0) {
          console.warn('do_details is empty or not an array:', deliveryData.do_details);
        }

        // Ambil brand dari do_details.product.brand (ambil dari item pertama, asumsikan brand konsisten)
        const brand = doDetails.length > 0 ? doDetails[0].product?.brand || 'JajaID' : 'JajaID';

        const mappedOrderDetails = {
          order_id: deliveryData.code_delivery_order || `DO-${id_delivery_order}`,
          id_data: deliveryData.id_data || state?.orderDetails?.id_data || null,
          id_invoice: deliveryData.id_invoice || null,
          invoice_no: deliveryData.invoice_no || null,
          created_date: new Date(deliveryData.delivery_date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          created_time: new Date(deliveryData.delivery_date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          nama_customer: deliveryData.nama_customer || 'Tidak Diketahui',
          alamat_pengiriman: deliveryData.shipping_address || 'Tidak Diketahui',
          nama_penerima: deliveryData.nama_customer || 'Tidak Diketahui',
          telp_penerima: state?.orderDetails?.telp_penerima || 'Tidak Tersedia',
          brand: brand, // Gunakan brand dari API response
          subtotal: state?.selectedProducts?.reduce((sum, item) => {
            const rate = item.price || 0;
            const discount = item.discount || 0;
            const quantity = item.qty || 0;
            return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
          }, 0) || doDetails.reduce((sum, detail) => {
            const rate = detail.product?.price || 0;
            const discount = detail.discount || 0;
            const quantity = parseInt(detail.quantity) || 0;
            return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
          }, 0) || 0,
          biaya_ongkir: deliveryData.shipping_price || 0,
          total_tagihan:
            (state?.selectedProducts?.reduce((sum, item) => {
              const rate = item.price || 0;
              const discount = item.discount || 0;
              const quantity = item.qty || 0;
              return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
            }, 0) || doDetails.reduce((sum, detail) => {
              const rate = detail.product?.price || 0;
              const discount = detail.discount || 0;
              const quantity = parseInt(detail.quantity) || 0;
              return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
            }, 0) || 0) + (deliveryData.shipping_price || 0),
          diskon_voucher: state?.orderDetails?.diskon_voucher || 0,
          diskon_voucher_toko: state?.orderDetails?.diskon_voucher_toko || 0,
          pesan_customer: deliveryData.message || '[Tidak Ada Pesan]',
          pesan_package: state?.orderDetails?.pesan_package || '[Tidak Ada Catatan Package]',
          pengiriman: deliveryData.ship_via || 'Tidak Diketahui',
          platform: 'Direct',
          status_transaksi: deliveryData.is_shipped ? 'SHIPPED' : 'PAID',
          is_shipped: deliveryData.is_shipped || 0,
          tb_transaksi_directs: doDetails.map(detail => ({
            id_delivery_order_detail: detail.id_delivery_order_detail,
            product_id: detail.product_id.toString(),
            product_name: detail.product?.name || detail.description || 'Produk Tidak Diketahui',
            rate: detail.product?.price || 0,
            quantity: parseInt(detail.quantity) || 0,
            discount: detail.discount || 0,
            discount_type: 'percent',
            taxable: detail.taxable || false,
            ppn: parseFloat(detail.ppn) || 0,
            amount:
              parseInt(detail.quantity) === 0
                ? detail.product?.price || 0
                : (parseInt(detail.quantity) || 0) * (detail.product?.price || 0) * (1 - (detail.discount || 0) / 100),
            description: detail.description || detail.product?.description || 'Tidak Ada Deskripsi',
          })),
          approval_status: deliveryData.approval_status || 'pending',
          approval_date: deliveryData.approval_date || null,
        };

        setOrderDetails(mappedOrderDetails);
        setIsShipped(mappedOrderDetails.is_shipped);
        const initialRemainingQty = {};
        mappedOrderDetails.tb_transaksi_directs.forEach(item => {
          initialRemainingQty[item.product_id] = item.quantity;
        });
        setRemainingQty(initialRemainingQty);
      } catch (error) {
        console.error('Error fetching delivery order:', error);
        console.log('API response:', error.response?.data);
        setError('Failed to load delivery order details. Please try again or contact support.');

        if (state?.orderDetails && state?.selectedProducts) {
          const mappedOrderDetails = {
            order_id: `DO-${id_delivery_order}`,
            id_data: state.orderDetails.id_data || null,
            created_date: new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            created_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            nama_customer: state.orderDetails.nama_customer || 'Tidak Diketahui',
            alamat_pengiriman: state.orderDetails.alamat_pengiriman || 'Tidak Diketahui',
            nama_penerima: state.orderDetails.nama_penerima || 'Tidak Diketahui',
            telp_penerima: state.orderDetails.telp_penerima || 'Tidak Tersedia',
            brand: 'JajaID', // Fallback ke JajaID jika API gagal
            subtotal: state.selectedProducts.reduce((sum, item) => {
              const rate = item.price || 0;
              const discount = item.discount || 0;
              const quantity = item.qty || 0;
              return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
            }, 0),
            biaya_ongkir: state.orderDetails.biaya_ongkir || 15000,
            total_tagihan:
              state.selectedProducts.reduce((sum, item) => {
                const rate = item.price || 0;
                const discount = item.discount || 0;
                const quantity = item.qty || 0;
                return sum + (quantity === 0 ? rate : quantity * rate * (1 - discount / 100));
              }, 0) + (state.orderDetails.biaya_ongkir || 15000),
            diskon_voucher: state.orderDetails.diskon_voucher || 0,
            diskon_voucher_toko: state.orderDetails.diskon_voucher_toko || 0,
            pesan_customer: state.orderDetails.pesan_customer || '[Tidak Ada Pesan]',
            pesan_package: state.orderDetails.pesan_package || '[Tidak Ada Catatan Package]',
            pengiriman: state.orderDetails.pengiriman || 'Raja Cepat Nusantara',
            platform: 'Direct',
            status_transaksi: 'PAID',
            is_shipped: 0,
            tb_transaksi_directs: state.selectedProducts.map(item => ({
              product_id: item.id.toString(),
              product_name: item.name || 'Produk Tidak Diketahui',
              rate: item.price || 0,
              quantity: item.qty || 0,
              discount: item.discount || 0,
              discount_type: item.discount_type || 'percent',
              taxable: false,
              ppn: 0,
              amount: item.qty === 0 ? item.price || 0 : (item.qty || 0) * (item.price || 0) * (1 - (item.discount || 0) / 100),
              description: item.description || 'Tidak Ada Deskripsi',
            })),
          };

          setOrderDetails(mappedOrderDetails);
          setIsShipped(mappedOrderDetails.is_shipped);
          const initialRemainingQty = {};
          mappedOrderDetails.tb_transaksi_directs.forEach(item => {
            initialRemainingQty[item.product_id] = item.quantity;
          });
          setRemainingQty(initialRemainingQty);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id_delivery_order) {
      fetchDeliveryOrder();
    }
  }, [id_delivery_order, state]);

  const handleUpdateShippingStatus = async () => {
    try {
      setConfirmLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        id_delivery_order: parseInt(id_delivery_order),
        is_shipped: isShipped,
      };

      const response = await axios.post(
        `${baseUrl}/nimda/delivery-order/update-shipping-status`,
        payload,
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        notification.success({
          message: 'Success',
          description: 'Shipping status updated successfully.',
        });
        setOrderDetails(prev => ({
          ...prev,
          is_shipped: isShipped,
          status_transaksi: isShipped ? 'SHIPPED' : 'PAID',
        }));
      } else {
        throw new Error(response.data.message || 'Failed to update shipping status');
      }
    } catch (error) {
      console.error('Error updating shipping status:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to update shipping status',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const showUpdateShippingModal = () => {
    Modal.confirm({
      title: 'Konfirmasi Perubahan Status Pengiriman',
      content: (
        <div>
          Apakah Anda yakin ingin mengubah status pengiriman menjadi{' '}
          <strong>{isShipped === 1 ? 'Dikirim' : 'Belum Dikirim'}</strong>?
          {confirmLoading && (
            <Spin style={{ marginTop: 10, display: 'block', textAlign: 'center' }} />
          )}
        </div>
      ),
      okText: 'Konfirmasi',
      cancelText: 'Batal',
      okButtonProps: {
        disabled: confirmLoading,
        style: {
          background: confirmLoading ? undefined : '#1890ff',
          borderColor: confirmLoading ? undefined : '#1890ff',
          color: confirmLoading ? undefined : '#fff',
        },
      },
      cancelButtonProps: {
        style: {
          borderColor: '#ff4d4f',
          color: '#ff4d4f',
        },
      },
      onOk: () => {
        return handleUpdateShippingStatus();
      },
      onCancel() { },
    });
  };

  const handleOpenInvoiceModal = () => {
    if (!orderDetails?.tb_transaksi_directs) return;

    // Initialize items based on current data
    // Defaulting is_taxable to match the item's current taxable status from DB (if any) or false
    const items = orderDetails.tb_transaksi_directs.map(item => ({
      id_delivery_order_detail: item.id_delivery_order_detail,
      is_taxable: !!item.taxable,
      // Preserve other info needed for calculation/display in case we need to look it up from strict ID
      amount: item.amount
    }));
    setInvoiceItems(items);
    setIsInvoiceModalVisible(true);
  };

  const handleInvoiceItemChange = (id_detail, checked) => {
    setInvoiceItems(prev =>
      prev.map(item =>
        item.id_delivery_order_detail === id_detail
          ? { ...item, is_taxable: checked }
          : item
      )
    );
  };

  const handleSelectAllTaxable = (checked) => {
    setInvoiceItems(prev => prev.map(item => ({ ...item, is_taxable: checked })));
  };

  const handleProcessCreateInvoice = async () => {
    try {
      setConfirmLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        id_do: parseInt(id_delivery_order),
        items: invoiceItems.map(item => ({
          id_delivery_order_detail: item.id_delivery_order_detail,
          is_taxable: item.is_taxable
        }))
      };

      const response = await axios.post(
        `${baseUrl}/nimda/delivery-order/create-invoice-new`,
        payload,
        {
          headers: {
            Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        notification.success({
          message: 'Success',
          description: response.data.message || 'Invoice created successfully.',
        });
        const id_invoice = response.data.data?.invoice?.id_invoice;
        setIsInvoiceModalVisible(false);

        if (id_invoice) {
          // Update orderDetails with the new id_invoice and invoice_no
          setOrderDetails(prev => ({
            ...prev,
            id_invoice,
            invoice_no: response.data.data?.invoice?.invoice_no || `INV-${id_invoice}`,
          }));
          navigate(`/dashboard/invoice/detail-invoice/${id_invoice}`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create invoice',
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  // Helper to calculate totals for the modal
  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    // Calculate based on orderDetails items but using the taxable status from invoiceItems state
    orderDetails?.tb_transaksi_directs?.forEach(product => {
      const itemState = invoiceItems.find(i => i.id_delivery_order_detail === product.id_delivery_order_detail);
      const isTaxable = itemState ? itemState.is_taxable : false;

      const amount = Number(product.amount || 0);
      subtotal += amount;

      if (isTaxable) {
        taxTotal += amount * 0.11;
      }
    });

    const shipping = Number(orderDetails?.biaya_ongkir || 0);
    const grandTotal = subtotal + taxTotal + shipping;

    return { subtotal, taxTotal, shipping, grandTotal };
  };

  const invoiceTotals = calculateInvoiceTotals();


  const handleViewInvoice = () => {
    if (orderDetails?.id_invoice) {
      navigate(`/dashboard/invoice/detail-invoice/${orderDetails.id_invoice}`);
    } else {
      notification.error({
        message: 'Error',
        description: 'Invoice ID tidak tersedia.',
      });
    }
  };

  const ProductSelectionModal = ({ visible, onCancel, onOk, products, isDirect }) => {
    const [selectedProducts, setSelectedProducts] = useState(
      products && Array.isArray(products)
        ? products.map(p => ({
          ...p,
          id: p.product_id,
          name: p.product_name,
          price: p.rate,
          qty: p.quantity,
          originalQty: p.quantity,
          remainingQty: remainingQty[p.product_id],
          discount: p.discount,
          discount_type: 'percent',
          amount: p.amount,
          description: p.description,
        }))
        : []
    );

    const allProductIds = selectedProducts.map(p => p.id);
    const [selectedRowKeys] = useState(allProductIds);

    const modalColumns = [
      {
        title: 'Produk',
        dataIndex: 'name',
        key: 'name',
        render: (name, record) => (
          <div>
            <div className="font-bold text-gray-800">{name}</div>
            <div className="text-xs text-gray-500 whitespace-pre-line">{record.description}</div>
          </div>
        ),
      },
      {
        title: 'Qty',
        dataIndex: 'qty',
        key: 'qty',
        render: qty => <span>{qty}</span>,
      },
      {
        title: 'Harga',
        dataIndex: 'price',
        key: 'price',
        render: price => `Rp ${price.toLocaleString('id-ID')}`,
      },
      {
        title: 'Diskon',
        key: 'discount',
        render: (_, record) =>
          record.discount
            ? `${record.discount}${record.discount_type === 'percent' ? '%' : ' Rp'}`
            : '-',
      },
      {
        title: 'Jumlah',
        key: 'total',
        render: (_, record) => `Rp ${Math.round(record.amount).toLocaleString('id-ID')}`,
      },
    ];

    const rowSelection = {
      selectedRowKeys,
      type: 'checkbox',
      getCheckboxProps: () => ({
        disabled: true,
      }),
    };

    const handleOk = () => {
      onOk(selectedProducts);
    };

    return (
      <Modal
        title={
          <div className="flex items-center text-gray-700">
            <span className="mr-2">🛒</span>
            Pilih Produk
          </div>
        }
        open={visible}
        onCancel={onCancel}
        width={1000}
        footer={[
          <button
            key="back"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mr-2"
          >
            Batal
          </button>,
          <button
            key="submit"
            onClick={handleOk}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <span className="mr-2">✔</span>
            Konfirmasi
          </button>,
        ]}
      >
        <Table
          rowSelection={rowSelection}
          columns={modalColumns}
          dataSource={selectedProducts}
          rowKey="id"
          className="shadow-lg rounded-lg"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
        />
        <div className="mt-4 text-gray-600">
          Total Produk Dipilih: {selectedRowKeys.length} | Total Harga: Rp{' '}
          {selectedProducts
            .reduce((sum, p) => sum + p.amount, 0)
            .toLocaleString('id-ID')}
        </div>
      </Modal>
    );
  };

  const handlePrint = () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Pop-up window was blocked. Please allow pop-ups for this site to print.');
      return;
    }

    const printStyles = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        font-family: 'Plus Jakarta Sans', sans-serif;
        line-height: 1.5;
        color: #333;
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .print-container {
        max-width: 190mm;
        margin: 0 auto;
        padding: 10mm;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 4px 8px;
        font-size: 12px;
      }
      th {
        background-color: #f5f5f5;
      }
      .ant-divider {
        margin: 12px 0;
        border-top: 1px solid #ddd;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      h4 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }
      p {
        margin: 0 0 4px 0;
      }
      .text-xs {
        font-size: 10px;
      }
      .text-sm {
        font-size: 12px;
      }
      .font-bold {
        font-weight: bold;
      }
      .grid {
        display: grid;
      }
      .grid-cols-2 {
        grid-template-columns: 1fr 1fr;
      }
      .gap-4 {
        gap: 16px;
      }
      .mb-1 {
        margin-bottom: 4px;
      }
      .mb-2 {
        margin-bottom: 8px;
      }
      .mb-4 {
        margin-bottom: 16px;
      }
      .mt-6 {
        margin-top: 24px;
      }
      .p-3 {
        padding: 12px;
      }
      .border {
        border: 1px solid #ddd;
      }
      .rounded {
        border-radius: 4px;
      }
      .italic {
        font-style: italic;
      }
      @media print {
        .no-print {
          display: none;
        }
        button {
          display: none;
        }
      }
    `;

    // Penentuan logo berdasarkan brand dari API response
    const logoUrl = orderDetails?.brand === 'AUTO' ? JajaAuto : LogoJaja;

    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Order - ${orderDetails?.order_id || 'DO'}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div id="print-root"></div>
      </body>
      </html>
    `);

    const formatOrderHTML = () => {
      const products = orderDetails?.tb_transaksi_directs?.map((item, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.product_name}</td>
          <td style="text-align: right;">${item.quantity}</td>
          <td style="text-align: center;">Unit</td>
        </tr>
      `).join('') || '';

      return `
        <div class="print-container">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <h4 style="margin: 0;">DELIVERY ORDER</h4>
              <p class="text-sm">No. Order: ${orderDetails?.order_id || 'N/A'}</p>
              <p class="text-sm">Tanggal: ${orderDetails?.created_date || ''} ${orderDetails?.created_time || ''}</p>
            </div>
            <div style="text-align: right;">
              <img src="${logoUrl}" alt="${orderDetails?.brand === 'AUTO' ? 'Jaja Auto' : orderDetails?.brand || 'JajaID'}" style="height: 64px;">
            </div>
          </div>

          <hr style="margin: 12px 0; border: 0; border-top: 1px solid #ddd;">

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="mb-2">
                <p class="text-sm font-bold">Pengirim:</p>
                <p class="text-sm">${orderDetails?.brand === 'AUTO' ? 'Jaja Auto' : orderDetails?.brand || 'JajaID'}</p>
              </div>

              <div class="mb-2">
                <p class="text-sm font-bold">Detail Pemesan:</p>
                <p class="text-sm">${orderDetails?.nama_customer || 'N/A'}</p>
              </div>
            </div>

            <div>
              <div class="mb-2">
                <p class="text-sm font-bold">Pengiriman:</p>
                <p class="text-sm">${orderDetails?.pengiriman || 'Tidak tersedia'}</p>
              </div>

              <div class="mb-2">
                <p class="text-sm font-bold">Detail Pengiriman:</p>
                <p class="text-sm">Alamat: ${orderDetails?.alamat_pengiriman || 'N/A'}</p>
                <p class="text-sm">Penerima: ${orderDetails?.nama_penerima || 'N/A'}</p>
                <p class="text-sm">No. Telepon: ${orderDetails?.telp_penerima || 'N/A'}</p>
              </div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th style="width: 65%; text-align: left;">Nama Barang</th>
                <th style="width: 15%; text-align: right;">Qty</th>
                <th style="width: 15%; text-align: center;">Satuan</th>
              </tr>
            </thead>
            <tbody>
              ${products}
            </tbody>
          </table>

          <div>
            <div class="mb-2">
              <p class="text-sm font-bold">Catatan:</p>
              <p class="text-sm italic">${orderDetails?.pesan_customer || 'N/A'}</p>
            </div>
          </div>

          <div style="margin-top: 48px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center; width: 40%;">
              <div class="text-sm">Pengirim</div>
              <div style="height: 60px;"></div>
              <div style="border-top: 1px solid #333; width: 80%; margin: 0 auto;"></div>
            </div>
            <div style="text-align: center; width: 40%;">
              <div class="text-sm">Penerima</div>
              <div style="height: 60px;"></div>
              <div style="border-top: 1px solid #333; width: 80%; margin: 0 auto;"></div>
            </div>
          </div>
        </div>
      `;
    };

    const printContent = newWindow.document.getElementById('print-root');
    if (printContent) {
      printContent.innerHTML = formatOrderHTML();
    }

    newWindow.document.close();
    newWindow.onload = function () {
      setTimeout(() => {
        newWindow.print();
      }, 300);
    };
  };

  const handleBack = () => {
    navigate('/dashboard/delivery-order');
  };

  const handleSelectProduct = () => {
    setIsModalVisible(true);
  };

  const handleViewOrderDetail = () => {
    if (orderDetails?.id_data) {
      navigate(`/dashboard/order/detail-order/${orderDetails.id_data}`, {
        state: { orderDetails, selectedProducts: orderDetails.tb_transaksi_directs },
      });
    } else {
      notification.error({
        message: 'Error',
        description: 'Order ID tidak tersedia untuk navigasi.',
      });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalOk = selected => {
    const updatedRemainingQty = { ...remainingQty };
    selected.forEach(p => {
      updatedRemainingQty[p.id] = (updatedRemainingQty[p.id] || p.originalQty) - p.qty;
    });
    setRemainingQty(updatedRemainingQty);
    setIsModalVisible(false);
    navigate(`/dashboard/delivery-order/select/detail/${id_delivery_order}`, {
      state: { selectedProducts: selected, orderDetails },
    });
  };

  // Fetch lampiran
  const fetchAttachments = async () => {
    if (!orderDetails?.id_data) return;
    setAttachmentLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/nimda/transaksi/detail-lampiran/${orderDetails.id_data}`);
      if (response.data.code === 200) {
        const baseUrl = `${baseUrl}/lampiran/`;
        const formattedAttachments = response.data.data.map(item => ({
          id_lampiran: item.id_transaksi_lampiran,
          nama_file: item.nama_lampiran,
          keterangan: item.keterangan,
          url: `${baseUrl}${item.file_lampiran}`,
          date_added: item.date_added,
        }));
        setAttachments(formattedAttachments);
      }
    } catch (error) {
      // silent
    } finally {
      setAttachmentLoading(false);
    }
  };

  // Upload lampiran
  const handleUploadAttachment = async ({ file, onSuccess, onError }) => {
    setIsUploading(true);
    const formData = new FormData();
    // API expects fields: files and keterangan
    formData.append('files', file);
    formData.append('keterangan', keterangan);
    try {
      const token = localStorage.getItem('token');
      // POST to delivery-order lampiran endpoint as requested
      const response = await axios.post(
        `${baseUrl}/nimda/delivery-order/${id_delivery_order}/lampiran`,
        formData,
        {
          headers: {
            Authorization: token ? `${token}` : undefined,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      // treat success when API returns code 200 or success flag
      if (response.data && (response.data.code === 200 || response.data.success || response.status === 200)) {
        notification.success({ message: 'Sukses', description: 'Lampiran berhasil diunggah' });
        fetchAttachments();
        setKeterangan('');
        if (onSuccess) onSuccess(response.data);
      } else {
        if (onError) onError(response.data);
      }
    } catch (error) {
      if (onError) onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Hapus lampiran
  const handleDeleteAttachment = async (id_lampiran) => {
    Modal.confirm({
      title: 'Konfirmasi Hapus',
      content: 'Apakah Anda yakin ingin menghapus lampiran ini?',
      okText: 'Hapus',
      cancelText: 'Batal',
      okButtonProps: { className: 'flat-blue-btn' },
      cancelButtonProps: { style: { borderColor: '#ff4d4f', color: '#ff4d4f' } },
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          // Call the delivery-order delete lampiran endpoint
          const url = `${baseUrl}/nimda/delivery-order/delete-lampiran/${id_lampiran}`;
          await axios.delete(url, { headers: { Authorization: token ? `${token}` : undefined } });
          notification.success({ message: 'Sukses', description: 'Lampiran berhasil dihapus' });
          fetchAttachments();
        } catch (err) {
          console.error('Error deleting attachment:', err);
          notification.error({ message: 'Gagal', description: 'Gagal menghapus lampiran' });
        }
      },
    });
  };

  // Download lampiran
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

  // Preview lampiran
  const handlePreview = (url, fileName) => {
    if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
      window.open(url, '_blank');
    } else {
      setPreviewImage({ visible: true, url, fileName });
    }
  };

  // Fetch lampiran saat orderDetails berubah
  useEffect(() => {
    if (orderDetails?.id_data) fetchAttachments();
    // eslint-disable-next-line
  }, [orderDetails?.id_data]);

  // Approval/reject modal logic
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null); // 'approved' or 'rejected'
  const [approvalNote, setApprovalNote] = useState('');

  const showApprovalModal = (action) => {
    setApprovalAction(action);
    setIsApprovalModalVisible(true);
    setApprovalNote('');
  };
  const handleApprovalOk = async () => {
    if (!orderDetails?.id_delivery_order && !id_delivery_order) return;
    if (!approvalAction) return;
    setApprovalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        id_delivery_order: orderDetails?.id_delivery_order || parseInt(id_delivery_order),
        status: approvalAction,
      };
      const res = await axios.put(`${baseUrl}/nimda/delivery-order/approval`, payload, {
        headers: { Authorization: `${token}` },
      });
      if (res.data?.status === 200 || res.data?.success) {
        notification.success({ message: 'Sukses', description: res.data?.message || `Delivery Order berhasil di-${approvalAction}` });
        setApprovalStatus(approvalAction);
        // Update orderDetails with approval_status and approval_date from backend response
        setOrderDetails(prev => ({
          ...prev,
          approval_status: approvalAction,
          approval_date: res.data?.data?.approval_date || null
        }));
        setIsApprovalModalVisible(false);
        window.location.reload();
      } else {
        notification.error({ message: 'Gagal', description: res.data?.message || 'Gagal update status approval' });
      }
    } catch (e) {
      notification.error({ message: 'Gagal', description: e.message || 'Gagal update status approval' });
    } finally {
      setApprovalLoading(false);
    }
  };
  const handleApprovalCancel = () => {
    setIsApprovalModalVisible(false);
    setApprovalNote('');
  };

  if (loading) {
    return (
      <div className="delivery-detail-container">
        <div className="max-w-13xl mx-auto mobile-responsive">
          <Card bordered={false} className="modern-card">
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 20, color: '#666', fontSize: 16 }}>Memuat data delivery order...</div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="delivery-detail-container">
        <div className="max-w-13xl mx-auto mobile-responsive">
          <Card bordered={false} className="modern-card">
            <div className="section-header">
              <Title level={3} style={{ color: '#2c3e50' }}>Delivery Order</Title>
            </div>
            <div className="info-card" style={{ borderLeft: '4px solid #ff4d4f' }}>
              <div className="text-red-500 font-medium">{error}</div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="delivery-detail-container">
        <div className="max-w-13xl mx-auto mobile-responsive">
          <Card bordered={false} className="modern-card">
            <div className="section-header">
              <Title level={3} style={{ color: '#2c3e50' }}>Delivery Order</Title>
            </div>
            <div className="info-card">
              <div className="text-gray-600">Error loading data or no data available.</div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const calculatedSubtotal = orderDetails.tb_transaksi_directs?.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  ) || 0;

  const updatedOrderDetails = {
    ...orderDetails,
    subtotal: calculatedSubtotal,
    biaya_ongkir: orderDetails.biaya_ongkir || 0,
    total_tagihan: calculatedSubtotal + (orderDetails.biaya_ongkir || 0),
    diskon_voucher: orderDetails.diskon_voucher || 0,
    diskon_voucher_toko: orderDetails.diskon_voucher_toko || 0,
    order_id: orderDetails.order_id || `DO-${Date.now()}`,
    alamat_pengiriman: orderDetails.alamat_pengiriman || 'Alamat Tidak Disediakan',
    nama_penerima: orderDetails.nama_penerima || 'Penerima Tidak Diketahui',
    telp_penerima: orderDetails.telp_penerima || 'Tidak Ada',
    pengiriman: orderDetails.pengiriman || 'Tidak Tersedia',
  };

  const productData =
    updatedOrderDetails.tb_transaksi_directs?.map((item, index) => ({
      key: item.product_id,
      no: index + 1,
      product: item.product_name,
      satuan: 'Unit',
      quantity: item.quantity,
      price: Number(item.rate).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      discount: `${Number(item.discount).toLocaleString('id-ID')}%`,
      total: Number(item.amount).toLocaleString('id-ID', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    })) || [];

  const columns = [
    { title: 'No', key: 'no', dataIndex: 'no', align: 'center' },
    {
      title: 'Nama Barang',
      key: 'product',
      dataIndex: 'product',
      render: text => <Text strong>{text}</Text>,
    },
    { title: 'Qty', key: 'quantity', dataIndex: 'quantity', align: 'right' },
    { title: 'Satuan', key: 'satuan', dataIndex: 'satuan', align: 'center' },
    {
      title: 'Harga @',
      key: 'price',
      dataIndex: 'price',
      render: text => `Rp ${text}`,
      align: 'right',
    },
    { title: 'Disc', key: 'discount', dataIndex: 'discount', align: 'center' },
    {
      title: 'Total',
      key: 'total',
      dataIndex: 'total',
      render: text => `Rp ${text}`,
      align: 'right',
    },
  ];

  return (
    <>
      <style>{responsiveStyles}</style>
      <style>{`
  @media (max-width: 768px) {
    .print-button { width: 100%; }
    .ant-btn { width: 100%; margin-bottom: 0 !important; }
    .flex.flex-col.sm\:flex-row.gap-2 { gap: 10px; }
    .flex.flex-col.sm\:flex-row.gap-2 > * { width: 100%; }
    .mt-2.sm\:mt-0.sm\:ml-4 { margin-left: 0 !important; margin-top: 10px !important; }
  }
`}</style>
      <div className="delivery-detail-container">
        <div className="floral-decoration">
          {/* Petals - Kelopak Bunga Jatuh */}
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>
          <div className="petal"></div>

          {/* Floating Bubbles - Gelembung Mengambang */}
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>
          <div className="floating-bubble"></div>

          {/* Sparkles - Efek Berkilau */}
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>

          {/* Decorative Corners - Hiasan Sudut */}
          <div className="decorative-corner top-left"></div>
          <div className="decorative-corner top-right"></div>
          <div className="decorative-corner bottom-left"></div>
          <div className="decorative-corner bottom-right"></div>
        </div>
        <div className="max-w-13xl mx-auto mobile-responsive">
          <Card bordered={false} className="modern-card mobile-responsive-card">
            <div className="section-header">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <Title level={3} className="mb-0" style={{ color: '#2c3e50', fontWeight: 600 }}>Delivery Order</Title>
                <div className="w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-stretch sm:items-center">
                    <Button
                      icon={<EyeOutlined />}
                      onClick={handleViewOrderDetail}
                      disabled={!orderDetails.id_data}
                      type={orderDetails.id_data ? 'default' : 'primary'}
                      className="modern-button w-full sm:w-auto"
                    >
                      Lihat Order Detail
                    </Button>
                    <Button
                      icon={orderDetails.id_invoice ? <EyeOutlined /> : <FileAddOutlined />}
                      className="modern-button w-full sm:w-auto"
                      style={{ background: '#4caf50', borderColor: '#4caf50', color: '#fff' }}
                      onClick={orderDetails.id_invoice ? handleViewInvoice : handleOpenInvoiceModal}
                      disabled={approvalStatus !== 'approved' ? true : false}
                    >
                      {orderDetails.id_invoice ? 'Lihat Invoice' : 'Create Invoice'}
                    </Button>
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      className="modern-button print-button w-full sm:w-auto"
                      style={{ background: '#2196f3', borderColor: '#2196f3' }}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                    {(userRole === 'partnership' || String(userId) === '39' || userId === 39) && (
                      <>
                        <Button
                          type="primary"
                          style={{ background: '#52c41a', borderColor: '#52c41a' }}
                          onClick={() => showApprovalModal('approved')}
                          loading={approvalLoading}
                          disabled={approvalStatus === 'approved'}
                          className="modern-button w-full sm:w-auto"
                        >
                          Approve
                        </Button>
                        <Button
                          type="default"
                          style={{ background: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff' }}
                          onClick={() => showApprovalModal('rejected')}
                          loading={approvalLoading}
                          disabled={approvalStatus === 'rejected'}
                          className="modern-button w-full sm:w-auto ml-2"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {/* Approval status stamp always visible, now at the end of button row */}
                    <div className="flex items-center ml-0 sm:ml-4 status-badge" style={{ minWidth: 120 }}>
                      {approvalLoading ? (
                        <Spin />
                      ) : (
                        (() => {
                          switch ((approvalStatus || '').toLowerCase()) {
                            case 'approved':
                              // Parse the approval_date from orderDetails or use current date as fallback
                              const approvalDate = orderDetails?.approval_date ? new Date(orderDetails.approval_date) : new Date();
                              const year = approvalDate.getFullYear();
                              const date = approvalDate.toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              });
                              const time = approvalDate.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      padding: '4px 10px',
                                      border: '1.5px solid #52c41a',
                                      color: '#52c41a',
                                      fontWeight: 700,
                                      borderRadius: 6,
                                      fontSize: 12,
                                      background: '#e6ffed',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 22 22"
                                      style={{ marginRight: 6 }}
                                    >
                                      <circle cx="11" cy="11" r="11" fill="#52c41a" />
                                      <polyline
                                        points="6,12 10,16 16,7"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    <span style={{ fontSize: 12 }}>APPROVED</span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#666',
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    <div>Year: {year}</div>
                                    <div>Date: {date}</div>
                                    <div>Time: {time}</div>
                                  </div>
                                </div>
                              );
                            case 'rejected':
                              return (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    padding: '4px 10px',
                                    border: '1.5px solid #ff4d4f',
                                    color: '#ff4d4f',
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    fontSize: 12,
                                    background: '#fff1f0',
                                    marginTop: 0,
                                    alignItems: 'center',
                                  }}
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 22 22"
                                    style={{ marginRight: 6 }}
                                  >
                                    <circle cx="11" cy="11" r="11" fill="#ff4d4f" />
                                    <line
                                      x1="7"
                                      y1="7"
                                      x2="15"
                                      y2="15"
                                      stroke="#fff"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <line
                                      x1="15"
                                      y1="7"
                                      x2="7"
                                      y2="15"
                                      stroke="#fff"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <span style={{ fontSize: 12 }}>REJECTED</span>
                                </div>
                              );
                            case 'pending':
                            default:
                              return (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    padding: '4px 10px',
                                    border: '1.5px dashed #aaa',
                                    color: '#666',
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    fontSize: 12,
                                    background: '#fafafa',
                                    marginTop: 0,
                                    alignItems: 'center',
                                  }}
                                >
                                  <span role="img" aria-label="waiting" style={{ marginRight: 6 }}>
                                    ⏳
                                  </span>
                                  <span style={{ fontSize: 12 }}>PENDING</span>
                                </div>
                              );
                          }
                        })()
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Left column: Order number and date */}
                <div>
                  <div className="text-gray-500 font-medium">Nomor Order</div>
                  <div className="font-semibold text-gray-800 text-lg">{updatedOrderDetails.order_id}</div>

                  <div className="mt-3 text-gray-500 font-medium">Tanggal Transaksi</div>
                  <div className="font-semibold text-gray-800">{updatedOrderDetails.created_date}</div>
                </div>

                {/* Right column: Shipping details */}
                <div>
                  <div className="mb-3 text-gray-700 font-semibold text-base" style={{ color: '#2c3e50' }}>Detail Pengiriman</div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 min-w-[90px] font-medium">Pengirim</span>
                      <span className="text-gray-800">: {updatedOrderDetails.brand === 'AUTO' ? 'Jaja Auto' : (updatedOrderDetails.brand || 'JajaID')}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 min-w-[90px] font-medium">Alamat</span>
                      <span className="text-gray-800">: {updatedOrderDetails.alamat_pengiriman}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 min-w-[90px] font-medium">Penerima</span>
                      <span className="text-gray-800">: {updatedOrderDetails.nama_penerima}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 min-w-[90px] font-medium">No. Telepon</span>
                      <span className="text-gray-800">: {updatedOrderDetails.telp_penerima}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="table-modern mb-6">
              <Table
                columns={columns}
                dataSource={productData}
                pagination={false}
                rowKey="key"
                scroll={{ x: 'max-content' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="info-card">
                <div className="mb-3 text-gray-600 text-sm font-semibold">Pesan Customer :</div>
                <div className="text-gray-600 italic text-sm mb-4">{updatedOrderDetails.pesan_customer}</div>
                <div className="mb-3 text-gray-600 text-sm font-semibold">Catatan Package :</div>
                <div className="text-gray-600 italic text-sm mb-4">{updatedOrderDetails.pesan_package}</div>
                <div className="mb-3 text-gray-600 text-sm font-semibold">Terbilang :</div>
                <div className="text-gray-600 italic text-sm">-</div>
              </div>
              <div className="summary-card">
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Total Harga :</span>
                    <span className="text-sm">
                      Rp{' '}
                      {Number(updatedOrderDetails.subtotal).toLocaleString('id-ID', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Pengiriman :</span>
                    <span className="text-sm">
                      Rp{' '}
                      {Number(updatedOrderDetails.biaya_ongkir).toLocaleString('id-ID', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-xs">{updatedOrderDetails.pengiriman} :</span>
                    <span className="text-sm"></span>
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-600 text-sm">GRAND TOTAL :</span>
                  <span className="text-sm">
                    Rp{' '}
                    {Number(updatedOrderDetails.total_tagihan).toLocaleString('id-ID', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Lampiran modern, clean, di dalam Card utama, tanpa tombol unggah */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-lg tracking-wide" style={{ color: '#2c3e50' }}>Lampiran</span>
                <div>
                  <Button
                    type="primary"
                    icon={<FileAddOutlined />}
                    onClick={() => setIsModalVisibleLampiran(true)}
                    style={{ background: '#007bff', borderColor: '#007bff' }}
                  >
                    + Tanda Terima
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {attachments.length === 0 ? (
                  <div className="text-gray-400 text-sm py-4 text-center info-card">Belum ada lampiran</div>
                ) : (
                  attachments.map(item => (
                    <div
                      key={item.id_lampiran}
                      className="attachment-item flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-gray-900 text-base mb-1">{item.nama_file}</div>
                        <div className="text-xs text-gray-500">
                          Diunggah: {item.date_added ? new Date(item.date_added).toLocaleString('id-ID') : '-'}<br />
                          Keterangan: {item.keterangan || 'Tidak ada'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handlePreview(item.url, item.nama_file)}
                          type="default"
                          className="modern-button outline-btn outline-blue"
                          style={{ minWidth: 110, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}
                          icon={
                            <span style={{
                              backgroundColor: '#2b6ea3',
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff'
                            }}>
                              <EyeOutlined style={{ fontSize: 12, color: '#fff' }} />
                            </span>
                          }
                        >
                          <span style={{ color: '#2b6ea3', fontWeight: 600 }}>Preview</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteAttachment(item.id_lampiran)}
                          type="default"
                          className="modern-button outline-btn outline-red"
                          title="Hapus"
                          aria-label="Hapus lampiran"
                          style={{ minWidth: 44, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}
                          icon={
                            <span style={{
                              backgroundColor: '#b91c1c',
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff'
                            }}>
                              <DeleteOutlined style={{ fontSize: 12, color: '#fff' }} />
                            </span>
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* History Komentar */}
            <div className="mt-10 mb-10">
              {/* Input Komentar */}
              <div className="info-card mb-8 border-2 border-green-50 bg-white shadow-sm overflow-visible">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm border-2 border-white">
                    {userRole?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <Input.TextArea
                      placeholder="Tulis komentar atau update pengiriman di sini..."
                      value={newKomentar}
                      onChange={(e) => setNewKomentar(e.target.value)}
                      rows={3}
                      className="rounded-xl border-gray-200 focus:border-green-400 focus:shadow-none transition-all"
                      style={{ resize: 'none' }}
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        type="primary"
                        onClick={handleSubmitKomentar}
                        loading={isSubmittingKomentar}
                        disabled={!newKomentar.trim()}
                        className="rounded-lg px-6 font-semibold shadow-md"
                        style={{ background: '#4caf50', borderColor: '#4caf50' }}
                      >
                        Kirim Komentar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-bold text-xl tracking-tight" style={{ color: '#2c3e50' }}>🛋️ Riwayat Komentar</span>
                <Button
                  type="link"
                  onClick={fetchHistory}
                  loading={historyLoading}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Refresh
                </Button>
              </div>



              <div className="table-modern">
                <Table
                  dataSource={historyKomentar}
                  loading={historyLoading}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: <div className="py-10 text-gray-400">Belum ada riwayat komentar</div> }}
                  rowKey={(record, index) => record.id_delivery_history || index}
                  columns={[
                    {
                      title: 'Waktu',
                      dataIndex: 'tgl',
                      key: 'tgl',
                      width: 180,
                      render: (tgl) => (
                        <div className="text-gray-600 text-xs">
                          <div className="font-semibold">{tgl ? new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</div>
                          <div className="text-[10px] opacity-70">{tgl ? new Date(tgl).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                        </div>
                      )
                    },
                    {
                      title: 'User',
                      key: 'user',
                      width: 200,
                      render: (_, record) => (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-[10px] shrink-0 border border-blue-100">
                            {record.nama_lengkap?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-700 text-xs truncate">{record.nama_lengkap}</div>
                            <div className="text-[10px] text-gray-400 truncate">@{record.username}</div>
                          </div>
                        </div>
                      )
                    },
                    {
                      title: 'Komentar',
                      dataIndex: 'komentar',
                      key: 'komentar',
                      render: (text) => (
                        <div className="text-gray-700 text-sm py-1">
                          {text}
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            </div>
            {/* Modal untuk tambah Tanda Terima */}
            <Modal
              title="Tambah Tanda Terima"
              visible={isModalVisibleLampiran}
              onCancel={() => { setIsModalVisibleLampiran(false); setKeterangan(''); setTempFile(null); }}
              footer={null}
              centered
            >
              <div className="space-y-4">
                <div>
                  <label className="font-medium">Keterangan</label>
                  <Input.TextArea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={4}
                    placeholder="Masukkan keterangan tanda terima"
                  />
                </div>
                <div>
                  <label className="font-medium">Upload file</label>
                  <Upload
                    beforeUpload={(file) => { setTempFile(file); return false; }}
                    accept="image/*,.pdf,.jpg,.jpeg,.png"
                    multiple={false}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>Pilih file</Button>
                    {tempFile && <span style={{ marginLeft: 12 }}>{tempFile.name}</span>}
                  </Upload>
                </div>
                <div className="flex justify-end gap-3">
                  <Button onClick={() => { setIsModalVisibleLampiran(false); setKeterangan(''); setTempFile(null); }}>Batal</Button>
                  <Button
                    type="primary"
                    className="flat-blue-btn"
                    loading={isUploading}
                    onClick={async () => {
                      if (!tempFile) {
                        notification.warning({ message: 'Pilih file', description: 'Silakan pilih file terlebih dahulu.' });
                        return;
                      }
                      // panggil fungsi upload yang sudah ada
                      await handleUploadAttachment({
                        file: tempFile,
                        onSuccess: () => {
                          setIsModalVisibleLampiran(false);
                          setKeterangan('');
                          setTempFile(null);
                          fetchAttachments();
                        },
                        onError: (err) => {
                          notification.error({ message: 'Gagal', description: 'Gagal mengunggah lampiran.' });
                        },
                      });
                    }}
                  >
                    Unggah
                  </Button>
                </div>
              </div>
            </Modal>
          </Card>
        </div>
      </div>
      <ProductSelectionModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        products={orderDetails.tb_transaksi_directs}
        isDirect={true}
      />
      {/* Modal Preview Image */}
      <Modal
        open={previewImage.visible}
        onCancel={() => { setPreviewImage({ visible: false, url: '', fileName: '' }); setZoomLevel(0); }}
        footer={[
          <Button
            key="ok"
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 600, fontSize: 16, padding: '6px 32px' }}
            onClick={() => { setPreviewImage({ visible: false, url: '', fileName: '' }); setZoomLevel(0); }}
          >
            OK
          </Button>
        ]}
        width={600}
        centered
        title={previewImage.fileName}
        bodyStyle={{ padding: 0, textAlign: 'center', background: '#f8fafc' }}
        closeIcon
      >
        {previewImage.url && (
          <img
            src={previewImage.url}
            alt={previewImage.fileName}
            style={{
              maxWidth: zoomLevel === 0 ? '100%' : zoomLevel === 1 ? '100vw' : '200vw',
              maxHeight: zoomLevel === 0 ? '60vh' : zoomLevel === 1 ? '90vh' : '180vh',
              objectFit: 'contain',
              margin: '24px auto',
              cursor: zoomLevel === 2 ? 'zoom-out' : 'zoom-in',
              transition: 'all 0.2s'
            }}
            onClick={() => setZoomLevel(z => (z + 1) % 3)}
          />
        )}
      </Modal>

      {/* Modal Approval Tetap */}
      <Modal
        title={approvalAction === 'approved' ? 'Konfirmasi Approve' : 'Konfirmasi Reject'}
        open={isApprovalModalVisible}
        onOk={handleApprovalOk}
        onCancel={handleApprovalCancel}
        okText={approvalAction === 'approved' ? 'Approve' : 'Reject'}
        okButtonProps={{ style: approvalAction === 'approved' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }, disabled: approvalLoading }}
        cancelButtonProps={{ disabled: approvalLoading }}
        confirmLoading={approvalLoading}
      >
        <div style={{ marginBottom: 12 }}>
          Apakah Anda yakin ingin <b>{approvalAction === 'approved' ? 'MENYETUJUI' : 'MENOLAK'}</b> transaksi ini?
        </div>
        <Input.TextArea
          rows={3}
          placeholder="Keterangan (opsional)"
          value={approvalNote}
          onChange={e => setApprovalNote(e.target.value)}
          disabled={approvalLoading}
        />
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        title="Create Invoice"
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsInvoiceModalVisible(false)}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={confirmLoading}
            onClick={handleProcessCreateInvoice}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            Create Invoice
          </Button>
        ]}
      >
        <div className="mb-4">
          <Table
            dataSource={orderDetails?.tb_transaksi_directs || []}
            pagination={false}
            rowKey="id_delivery_order_detail"
            scroll={{ x: 'max-content' }}
            columns={[
              { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
              {
                title: 'Price',
                dataIndex: 'rate',
                key: 'rate',
                align: 'right',
                render: (val, record) => {
                  const itemState = invoiceItems.find(i => i.id_delivery_order_detail === record.id_delivery_order_detail);
                  const isTaxable = itemState?.is_taxable || false;
                  // Jika taxable, harga dpp = rate / 1.11
                  // Jika tidak taxable, harga = rate
                  const displayPrice = isTaxable ? (Number(val) / 1.11) : Number(val);
                  return `Rp ${Number(displayPrice).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                }
              },
              { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center' },
              {
                title: 'Line Total',
                dataIndex: 'amount',
                key: 'amount',
                align: 'right',
                render: (val) => `Rp ${Number(val).toLocaleString('id-ID')}`
              },
              {
                title: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Checkbox
                      checked={invoiceItems.length > 0 && invoiceItems.every(item => item.is_taxable)}
                      indeterminate={invoiceItems.some(item => item.is_taxable) && !invoiceItems.every(item => item.is_taxable)}
                      onChange={(e) => handleSelectAllTaxable(e.target.checked)}
                    />
                    <span>Taxable (11%)</span>
                  </div>
                ),
                key: 'is_taxable',
                align: 'center',
                render: (_, record) => {
                  const itemState = invoiceItems.find(i => i.id_delivery_order_detail === record.id_delivery_order_detail);
                  return (
                    <Checkbox
                      checked={itemState?.is_taxable || false}
                      onChange={(e) => handleInvoiceItemChange(record.id_delivery_order_detail, e.target.checked)}
                    />
                  );
                }
              }
            ]}
          />
        </div>


      </Modal>
    </>
  );
};

export default DeliveryOrderPage;
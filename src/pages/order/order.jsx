import React, { useState, useEffect } from 'react';
import { Select, Button, Table, Tag, Space, Typography, Input, Modal, Radio, notification, DatePicker, Card, ConfigProvider } from 'antd';
import { useNavigate, Link, useParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { Title } = Typography;
const { RangePicker } = DatePicker;

const gradientColors = 'from-[#64b0c9] via-[#8ACDE3] to-[#B1EBFE]';

// Pemetaan status dari API ke tampilan
const statusMapping = {
  'Booked': 'Booked',
  'Paid': 'PAID',
  'Dibatalkan': 'CANCEL',
  'Selesai': 'SELESAI',
  'Partial': 'PARTIAL',
  'Open': 'OPEN',
  'Closed': 'CLOSED',
};

// Pemetaan balik untuk filter ke API
const reverseStatusMapping = {
  'Booked': 'Booked',
  'PAID': 'Paid',
  'CANCEL': 'Dibatalkan',
  'SELESAI': 'Selesai',
  'PARTIAL': 'Partial',
  'OPEN': 'Open',
  'CLOSED': 'Closed',
};

const Order = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(null);
  const [status, setStatus] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [sales, setSales] = useState(null);
  const [corporateName, setCorporateName] = useState('');
  const [keyword, setKeyword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [brand, setBrand] = useState('JAJAID');
  const [isDOFilter, setIsDOFilter] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [salesList, setSalesList] = useState([]);
  const [companyList, setCompanyList] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  // Status update modal state
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [modalRecord, setModalRecord] = useState(null);
  const [modalSelectedStatus, setModalSelectedStatus] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  const navigate = useNavigate();
  const { id_pengajuan } = useParams();

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const years = [];
    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      { value: '1', label: 'Januari' },
      { value: '2', label: 'Februari' },
      { value: '3', label: 'Maret' },
      { value: '4', label: 'April' },
      { value: '5', label: 'Mei' },
      { value: '6', label: 'Juni' },
      { value: '7', label: 'Juli' },
      { value: '8', label: 'Agustus' },
      { value: '9', label: 'September' },
      { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' },
      { value: '12', label: 'Desember' },
    ];
  };

  const fetchSales = async () => {
    try {
      const response = await fetch(`${baseUrl}/nimda/sales/get-sales`);
      const result = await response.json();
      if (result.code === 200) {
        setSalesList(result.data);
      } else {
        console.error("Failed to fetch sales:", result.message);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${baseUrl}/nimda/company/get-company?limit=1000&page=1`);
      const result = await response.json();
      if (result.code === 200) {
        setCompanyList(result.data);
      } else {
        console.error("Failed to fetch companies:", result.message);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTransactions = async (page = 1, limit = 10) => {
    setLoading(true);
    const fetchLimit = 1000;

    try {
      // Build query params. Prefer `searchTerm` from the "Cari Pesanan" input for keyword.
      const paramsObject = {
        limit: fetchLimit,
        page: 1,
        tahun: year || '',
        bulan: month || '',
        status: status ? reverseStatusMapping[status] : '',
        platform: platform || '',
        sales: sales || '',
        corporateName: corporateName || '',
        brand: brand || '',
        isDO: isDOFilter !== null ? isDOFilter : '',
        keyword: searchTerm || keyword || '', // prefer searchTerm
        approvalStatus: approvalStatus || '',
        _t: Date.now(),
      };

      if (dateRange && dateRange[0] && dateRange[1]) {
        paramsObject.startDate = dateRange[0].format('YYYY-MM-DD');
        paramsObject.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      // If the user searched a reference-like value (e.g. "NO SP 120"), also pass it as no_referensi
      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().toUpperCase().startsWith('NO SP')) {
        paramsObject.no_referensi = searchTerm.trim();
      }

      const queryParams = new URLSearchParams(paramsObject).toString();
      const apiUrl = `${baseUrl}/nimda/transaksi/get-transaksi?${queryParams}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          Accept: "application/json",
          ...(localStorage.getItem("token") && { Authorization: ` ${localStorage.getItem("token")}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200) {
        const formattedData = result.data.map((item) => ({
          ...item,
          datetime: `${item.created_date} ${item.created_time}`,
          status_transaksi: statusMapping[item.status_transaksi] || item.status_transaksi,
          id_pengajuan: item.id_pengajuan || null,
        }));

        let filteredData = formattedData;
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          filteredData = formattedData.filter((item) => {
            const matchesOrderId = item.order_id && item.order_id.toLowerCase().includes(lowerSearchTerm);
            const matchesCustomer = item.nama_customer && item.nama_customer.toLowerCase().includes(lowerSearchTerm);
            const matchesTotal = item.total_pembayaran && item.total_pembayaran.toString().includes(searchTerm);
            const matchesReferensi = item.no_referensi && item.no_referensi.toLowerCase().includes(lowerSearchTerm);
            return matchesOrderId || matchesCustomer || matchesTotal || matchesReferensi;
          });
        }

        const sortedData = filteredData.sort((a, b) => {
          const parseOrderId = (orderId) => {
            if (!orderId || typeof orderId !== 'string' || !orderId.includes('-')) {
              return { year: 0, seq: 0 };
            }
            const parts = orderId.split('-');
            if (parts.length !== 4) {
              return { year: 0, seq: 0 };
            }
            const yearPart = parts[2] ? parseInt(parts[2], 10) : 0;
            const seqPart = parts[3] ? parseInt(parts[3], 10) : 0;
            return { year: yearPart, seq: seqPart };
          };
          const orderA = parseOrderId(a.order_id);
          const orderB = parseOrderId(b.order_id);

          if (orderA.year !== orderB.year) {
            return orderB.year - orderA.year;
          }
          return orderB.seq - orderA.seq;
        });

        const startIndex = (page - 1) * limit;
        const paginatedData = sortedData.slice(startIndex, startIndex + limit);

        setTransactions(paginatedData);
        // Prefer server-provided totalData if available, otherwise fall back to client counts
        setTotalData(result.totalData !== undefined ? result.totalData : (searchTerm ? sortedData.length : formattedData.length));

        if (searchTerm && filteredData.length === 0) {
          alert(`No results found for "${searchTerm}". The record may not exist or is filtered out. Check console logs for details.`);
        }
      } else {
        console.error(`Failed to fetch transactions:`, result.message);
        alert(`Failed to fetch data: ${result.message}`);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert(`Error fetching data: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const exportYear = year || new Date().getFullYear();
      const exportMonth = month || new Date().getMonth() + 1;
      let url = `${baseUrl}/nimda/transaksi/export-excel-sales-v3?`;

      const params = new URLSearchParams();
      if (brand) params.append('brand', brand);

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        if (year) params.append('year', year);
        if (month) params.append('month', month);
      }

      url += params.toString();

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ...(localStorage.getItem('token') && { Authorization: ` ${localStorage.getItem('token')}` }),
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengekspor data');
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `SalesReport_${exportYear}_${exportMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      notification.success({ message: 'Sukses', description: 'Data berhasil diekspor' });
    } catch (err) {
      console.error('Error exporting Excel (backend):', err);
      notification.error({ message: 'Gagal', description: err.message || 'Gagal mengekspor data' });
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCompanies();
  }, []);

  // Handlers for Update Status modal
  const openStatusModal = (record) => {
    setModalRecord(record);
    setModalSelectedStatus(record?.status_transaksi || null);
    setIsStatusModalVisible(true);
  };

  const handleStatusChange = (e) => {
    // e may be event or value depending on Radio usage
    const value = e && e.target ? e.target.value : e;
    setModalSelectedStatus(value);
  };

  const confirmStatusUpdate = () => {
    if (!modalRecord) return;

    // Map status string to numeric id expected by API.
    // Assumption: mapping follows the order provided in the UI. Adjust if your backend uses different ids.
    const statusToId = {
      Booked: 1,
      PAID: 2,
      CANCEL: 3,
      SELESAI: 4,
      PARTIAL: 5,
      OPEN: 6,
      CLOSED: 7,
    };

    const payload = {
      status_transaksi: modalSelectedStatus,
      id_status: statusToId[modalSelectedStatus] || null,
    };

    const doUpdate = async () => {
      setStatusUpdating(true);
      try {
        // determine which id to use for the API endpoint — try common fields
        const targetId = modalRecord.id_data || modalRecord.id_transaksi || modalRecord.id || modalRecord.id_do;
        const url = `${baseUrl}/nimda/transaksi/status/${targetId}`;
        console.log('Updating status, url:', url, 'payload:', payload);
        const token = localStorage.getItem('token');
        const res = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: ` ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const result = await res.json().catch(() => ({}));

        // Treat as success if HTTP ok OR API returns explicit success/code/status OR returns data
        if (res.ok || result.success || result.code === 200 || result.status === 200 || result.data) {
          // update local UI state
          setTransactions((prev) =>
            prev.map((t) => (t.id_data === modalRecord.id_data ? { ...t, status_transaksi: modalSelectedStatus } : t))
          );
          notification.success({ message: 'Sukses', description: result.message || 'Status berhasil diperbarui' });
          setIsStatusModalVisible(false);
          setModalRecord(null);
          setModalSelectedStatus(null);
        } else {
          throw new Error(result.message || 'Gagal mengupdate status');
        }
      } catch (err) {
        console.error('Error updating status:', err);
        notification.error({ message: 'Gagal', description: err.message || 'Gagal mengupdate status' });
      } finally {
        setStatusUpdating(false);
      }
    };

    doUpdate();
  };

  const cancelStatusModal = () => {
    setIsStatusModalVisible(false);
    setModalRecord(null);
    setModalSelectedStatus(null);
  };

  useEffect(() => {
    fetchTransactions(currentPage, pageSize);
  }, [currentPage, pageSize, year, month, status, platform, sales, corporateName, brand, isDOFilter, keyword, approvalStatus, dateRange]);

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleNew = () => {
    navigate('/dashboard/order/create-order');
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 180,
      render: (text, record) => {
        const platform = record.platform;
        let tagColor = '';
        switch (platform) {
          case 'Direct':
            tagColor = 'blue';
            break;
          case 'Web':
            tagColor = 'green';
            break;
          case 'Android':
            tagColor = 'orange';
            break;
          case 'IOS':
            tagColor = 'purple';
            break;
          default:
            tagColor = 'gray';
        }
        return (
          <div>
            <Link
              to={`/dashboard/order/detail-order/${record.id_data}`}
              className="text-blue-500 hover:text-blue-700"
            >
              {text}
            </Link>
            <div className="flex flex-wrap gap-1 mt-1">
              {platform && (
                <Tag
                  color={tagColor}
                  style={{
                    fontSize: '8px',
                    padding: '0 3px',
                    borderRadius: '3px',
                    lineHeight: '16px',
                  }}
                >
                  {platform}
                </Tag>
              )}
              {record.approval_status === 'approved' && (
                <Tag
                  color="green"
                  style={{
                    fontSize: '8px',
                    padding: '0 3px',
                    borderRadius: '3px',
                    lineHeight: '16px',
                  }}
                >
                  approved
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Nama Customer',
      dataIndex: 'nama_customer',
      key: 'nama_customer',
      width: 150,
      ellipsis: false,
      render: (text) => <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{text}</div>,
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 150,
      ellipsis: false,
      render: (_, record) => {
        const company = companyList.find((c) => c.id_company === record.id_company);
        const companyName = company ? company.company_name : record.company_name || '-';
        return <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{companyName}</div>;
      },
    },
    {
      title: 'Sales',
      dataIndex: 'nama_sales',
      key: 'nama_sales',
      width: 120,
      render: (text, record) => (
        <div>
          {text}
          {record.brand && (
            <Tag
              style={{
                marginLeft: 8,
                fontSize: '10px',
                padding: '0 4px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                border: record.brand === 'JAJAID' ? '1px solid #1890ff' : '1px solid #ff4d4f',
                color: record.brand === 'JAJAID' ? '#1890ff' : '#ff4d4f',
              }}
            >
              {record.brand === 'JAJAID' ? 'JAJAID' : 'AUTO'}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'No Referensi',
      dataIndex: 'no_referensi',
      key: 'no_referensi',
      width: 130,
    },
    {
      title: 'DO Status',
      dataIndex: 'isDO',
      key: 'isDO',
      width: 80,
      align: 'center',
      render: (isDO) => (
        <div>
          {isDO ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status_transaksi',
      key: 'status_transaksi',
      width: 100,
      render: (status) => {
        let tagColor = '';
        switch (status) {
          case 'Booked':
            tagColor = 'orange';
            break;
          case 'PAID':
            tagColor = 'blue';
            break;
          case 'CANCEL':
            tagColor = 'red';
            break;
          case 'SELESAI':
            tagColor = 'green';
            break;
          case 'PARTIAL':
            tagColor = 'purple';
            break;
          case 'OPEN':
            tagColor = 'gold';
            break;
          case 'CLOSED':
            tagColor = 'volcano';
            break;
          default:
            tagColor = 'gray';
        }
        return (
          <Tag color={tagColor}>
            {status}
          </Tag>
        );
      },
    },
    // {
    //   title: 'Actions',
    //   key: 'actions',
    //   width: 140,
    //   render: (_, record) => (
    //     <Space align="center">
    //       <Button size="small" onClick={() => openStatusModal(record)}>
    //         Update Status
    //       </Button>
    //     </Space>
    //   ),
    // },
    {
      title: 'Pengajuan',
      dataIndex: 'progressPengajuan',
      key: 'progressPengajuan',
      width: 120,
      align: 'center',
      render: (progressPengajuan, record) => {
        let jumlah = '-';
        if (
          progressPengajuan &&
          typeof progressPengajuan.sudahPengajuan === 'number' &&
          typeof progressPengajuan.totalPengajuan === 'number'
        ) {
          if (progressPengajuan.totalPengajuan === 0) jumlah = '-';
          else jumlah = `${progressPengajuan.sudahPengajuan}/${progressPengajuan.totalPengajuan}`;
        }
        return (
          <span className="flex items-center justify-center gap-2">
            <span>{jumlah}</span>
            {record.isCompletePengajuan === true ? (
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            )}
          </span>
        );
      },
    },
    {
      title: 'Total',
      dataIndex: 'total_pembayaran',
      key: 'total_pembayaran',
      width: 120,
      render: (value) => value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    },
    {
      title: 'Tanggal',
      dataIndex: 'datetime',
      key: 'datetime',
      width: 150,
      render: (text) => text,
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Order
            </Title>
          </div>
          <div className="px-4 pb-6">
            <div className="flex flex-col gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Rentang Tanggal</label>
                  <RangePicker
                    id="range"
                    size="small"
                    onChange={(dates) => setDateRange(dates)}
                    value={dateRange}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Tahun</label>
                  <Select
                    id="year"
                    value={year}
                    style={{ width: '100%' }}
                    onChange={(value) => setYear(value)}
                    allowClear
                    size="small"
                  >
                    {generateYears().map((year) => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Bulan</label>
                  <Select
                    id="month"
                    value={month}
                    placeholder="Bulan"
                    style={{ width: '100%' }}
                    onChange={(value) => setMonth(value)}
                    allowClear
                    size="small"
                  >
                    {generateMonths().map((month) => (
                      <Option key={month.value} value={month.value}>{month.label}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Brand</label>
                  <Select
                    id="brand"
                    value={brand}
                    placeholder="Brand"
                    style={{ width: '100%' }}
                    onChange={(value) => setBrand(value)}
                    allowClear
                    size="small"
                  >
                    <Option value="JAJAID">JAJAID</Option>
                    <Option value="AUTO">JAJA AUTO</Option>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Status</label>
                  <Select
                    id="status"
                    placeholder="Status"
                    style={{ width: '100%' }}
                    onChange={(value) => setStatus(value)}
                    allowClear
                    size="small"
                  >
                    <Option value="Booked">Booked</Option>
                    <Option value="PAID">PAID</Option>
                    <Option value="CANCEL">CANCEL</Option>
                    <Option value="SELESAI">SELESAI</Option>
                    <Option value="PARTIAL">PARTIAL</Option>
                    <Option value="OPEN">OPEN</Option>
                    <Option value="CLOSED">CLOSED</Option>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Sales</label>
                  <Select
                    id="sales"
                    placeholder="Sales"
                    style={{ width: '100%' }}
                    onChange={(value) => setSales(value)}
                    allowClear
                    loading={salesList.length === 0}
                    size="small"
                  >
                    {salesList.map((sales) => (
                      <Option key={sales.id_sales} value={sales.id_sales}>{sales.nama_sales}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Perusahaan</label>
                  <Select
                    id="company"
                    placeholder="Company"
                    style={{ width: '100%' }}
                    dropdownStyle={{ width: 350 }}
                    onChange={(value) => setCorporateName(value)}
                    allowClear
                    loading={companyList.length === 0}
                    size="small"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {companyList.map((company) => (
                      <Option key={company.id_company} value={company.id_company}>
                        {company.company_name}
                      </Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih DO Status</label>
                  <Select
                    id="isDO"
                    placeholder="DO"
                    style={{ width: '100%' }}
                    onChange={(value) => setIsDOFilter(value === undefined ? null : value)}
                    allowClear
                    size="small"
                  >
                    <Option value={true}>With DO</Option>
                    <Option value={false}>Without DO</Option>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Pilih Approval Status</label>
                  <Select
                    id="approvalStatus"
                    placeholder="Approval"
                    style={{ width: '100%' }}
                    onChange={(value) => setApprovalStatus(value)}
                    allowClear
                    size="small"
                  >
                    <Option value="pending">Pending</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="rejected">Rejected</Option>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="font-medium mb-1 text-xs text-black">Cari Total Pembayaran</label>
                  <Input.Search
                    id="price"
                    type="number"
                    placeholder="Total"
                    onSearch={() => fetchTransactions(1, pageSize)}
                    onChange={(e) => setKeyword(e.target.value)}
                    value={keyword}
                    size="small"
                  />
                </div>
                <div className="flex flex-col lg:col-span-2">
                  <label className="font-medium mb-1 text-xs text-black">Cari Pesanan</label>
                  <Input.Search
                    id="search"
                    placeholder="Order ID / Customer / Total"
                    onSearch={() => fetchTransactions(1, pageSize)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                    size="small"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="primary"
                  onClick={handleNew}
                  style={{ backgroundColor: '#007BFF', borderColor: '#007BFF', fontSize: '12px' }}
                  className="w-full sm:w-auto h-8 px-6 rounded-md shadow-sm"
                >
                  New
                </Button>
                <Button
                  onClick={handleExportExcel}
                  loading={exportLoading}
                  style={{ backgroundColor: '#28A745', borderColor: '#28A745', fontSize: '12px' }}
                  className="w-full sm:w-auto h-8 px-4 rounded-md shadow-sm text-white"
                >
                  {exportLoading ? 'Exporting...' : 'Export Excel'}
                </Button>
              </div>
            </div>
            {/* Update Status modal (modern grid UI) */}
            <Modal
              title={<div className="text-lg font-semibold">Update Status</div>}
              visible={isStatusModalVisible}
              onOk={confirmStatusUpdate}
              onCancel={cancelStatusModal}
              okText="Update"
              cancelText="Batal"
              width={720}
              centered
              bodyStyle={{ padding: 24 }}
              okButtonProps={{ style: { backgroundColor: '#007BFF', borderRadius: 8, borderColor: '#007BFF' } }}
              cancelButtonProps={{ style: { borderRadius: 8 } }}
              confirmLoading={statusUpdating}
            >
              <div className="text-sm text-black mb-4">Pilih status baru untuk pesanan ini. Perubahan ini bersifat UI (tidak memanggil API) kecuali Anda menambahkan integrasi server.</div>

              {/* status options grid: first 6 in 2 columns x 3 rows, 7th centered below */}
              <div className="grid grid-cols-2 gap-4">
                {['Booked', 'PAID', 'CANCEL', 'SELESAI', 'PARTIAL', 'OPEN'].map((val) => (
                  <div
                    key={val}
                    role="button"
                    tabIndex={0}
                    onClick={() => setModalSelectedStatus(val)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setModalSelectedStatus(val); }}
                    className={`p-4 rounded-lg border cursor-pointer flex items-center justify-center transition-shadow ${modalSelectedStatus === val ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:shadow-sm'}`}
                  >
                    <div className="text-center">
                      <div className={`text-sm font-medium ${modalSelectedStatus === val ? 'text-blue-700' : 'text-gray-800'}`}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* extra option centered */}
              <div className="mt-4 flex justify-center">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setModalSelectedStatus('CLOSED')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setModalSelectedStatus('CLOSED'); }}
                  className={`w-1/2 p-4 rounded-lg border cursor-pointer flex items-center justify-center transition-shadow ${modalSelectedStatus === 'CLOSED' ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:shadow-sm'}`}
                >
                  <div className={`text-sm font-medium ${modalSelectedStatus === 'CLOSED' ? 'text-blue-700' : 'text-gray-800'}`}>CLOSED</div>
                </div>
              </div>
            </Modal>

            <Table
              columns={columns}
              dataSource={transactions}
              rowKey="id_data"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalData,
                showSizeChanger: true,
              }}
              onChange={handleTableChange}
              scroll={{ x: false }}
              className="ant-table-custom"
            />
          </div>
        </Card>
        <style jsx>{`
        .ant-table-custom .ant-table-thead > tr > th {
          background-color: #f9fafb;
          color: #374151;
          font-weight: 600;
          padding: 12px 8px;
          border-bottom: 2px solid #e5e7eb;
          font-size: 12px;
          white-space: normal;
          word-wrap: break-word;
        }
        .ant-table-custom .ant-table-tbody > tr > td {
          padding: 12px 8px;
          color: #4b5563;
          font-size: 12px;
          white-space: normal;
          word-wrap: break-word;
        }
        .ant-table-custom .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9;
        }
        .ant-table-custom .ant-pagination-item-active {
          background-color: #1890ff;
          border-color: #1890ff;
        }
        .ant-table-custom .ant-pagination-item-active a {
          color: #fff;
        }
      `}</style>
      </div>
    </ConfigProvider>
  );
};

export default Order;
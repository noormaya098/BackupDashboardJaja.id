import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Input, Select, DatePicker, message, Button, Card, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { FileTextOutlined, FileDoneOutlined, FileExclamationOutlined, FileExcelOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 3; y--) {
    years.push(y);
  }
  return years;
};

const generateMonths = () => {
  return [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];
};

// Static brand options (include a 'Semua' option)
const brandOptions = [
  { label: 'Semua', value: '' },
  { label: 'JAJAID', value: 'JAJAID' },
  { label: 'JAJA AUTO', value: 'AUTO' },
];

const DeliveryOrder = () => {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // 10 records per page
  const [totalData, setTotalData] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [brand, setBrand] = useState('');
  const [companyList, setCompanyList] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch user role from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.id_role);
      } catch (error) {
        console.error('Error parsing token:', error);
        setUserRole(null);
      }
    }
  }, []);

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${baseUrl}/nimda/company/get-company?limit=1000&page=1`, {
          headers: {
            Accept: 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
          },
        });
        const result = await response.json();
        if (result.code === 200) {
          setCompanyList(result.data);
        } else {
          message.error('Gagal mengambil daftar perusahaan');
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanyList([]);
        message.error('Error saat mengambil daftar perusahaan');
      }
    };
    fetchCompanies();
  }, []);

  // Handle search input
  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  // Handle customer name search input
  const handleCustomerSearch = (value) => {
    setCustomerName(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  // Fetch delivery orders with server-side pagination
  const fetchDeliveryOrders = async () => {
    setLoading(true);
    try {
      let url = `${baseUrl}/nimda/delivery-order?page=${currentPage}&limit=${pageSize}`;
      // If a specific date is selected, send it as `startDate` and `endDate`.
      // Otherwise, keep legacy behavior for role 4 using year/month.
      if (dateRange && dateRange[0] && dateRange[1]) {
        url += `&startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`;
      } else {
        const fetchYear = year || new Date().getFullYear();
        if (fetchYear) url += `&year=${fetchYear}`;
        if (month) url += `&month=${month}`;
      }
      if (approvalStatus && approvalStatus !== 'all') url += `&approval_status=${approvalStatus}`;
      if (brand) url += `&brand=${encodeURIComponent(brand)}`;
      if (selectedCompany) url += `&company_name=${encodeURIComponent(selectedCompany)}`;
      if (searchText) url += `&search=${encodeURIComponent(searchText)}`;
      if (customerName) url += `&nama_customer=${encodeURIComponent(customerName)}`;

      console.log('Fetching URL:', url);
      console.log('Pagination Info:', { currentPage, pageSize, totalData });
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(localStorage.getItem('token') && { Authorization: `${localStorage.getItem('token')}` }),
        },
      });
      const result = await response.json();
      console.log('API Response:', {
        message: result.message,
        totalAllData: result.totalAllData,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        perPage: result.perPage,
        dataLength: result.data ? result.data.length : 0,
        dataSample: result.data ? result.data.slice(0, 1) : [],
        fullResponse: result,
      });

      if (result.message === 'Success' && result.data) {
        const normalizedData = result.data
          .sort((a, b) => b.id_delivery_order - a.id_delivery_order)
          .map((item, idx) => ({
            key: item.id_delivery_order,
            no: (currentPage - 1) * pageSize + idx + 1,
            code_delivery_order: item.code_delivery_order || '-',
            reference_no: item.reference_no || '-',
            nama_customer: item.nama_customer || '-',
            company_name: item.company_name || '-',
            brand: item.transaksi?.brand || '-',
            total: item.total_price || 0,
            created_date: item.delivery_date || '-',
            no_referensi: item.transaksi?.no_referensi || '-',
            is_shipped: item.is_shipped,
            isInvoice: item.isInvoice,
            approval_status: item.approval_status || '-',
            sales_name: item.transaksi?.sales_name || '-',
            approval_date: item.approval_date || '-',
          }));
        setDeliveryOrders(normalizedData);
        setTotalData(result.totalAllData || 0); // Use totalAllData for total records
        console.log('Pagination Set:', { totalData: result.totalAllData || 0, pageSize, dataLength: normalizedData.length });
        if (normalizedData.length === 0 && currentPage === 1) {
          message.info('Tidak ada data ditemukan untuk filter saat ini. Coba ubah filter.');
        }
      } else {
        setDeliveryOrders([]);
        setTotalData(0);
        message.error('Tidak ada data delivery order ditemukan');
      }
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
      setDeliveryOrders([]);
      setTotalData(0);
      message.error('Error saat mengambil data delivery order');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const exportYear = year || new Date().getFullYear();
      const exportMonth = month;
      let url = `${baseUrl}/nimda/transaksi/export-excel-delivery-order-v3?`;

      const params = new URLSearchParams();

      // Brand Filter: JAJAID, AUTO, all
      if (brand) {
        params.append('brand', brand);
      } else {
        params.append('brand', 'all');
      }

      // Status Filter: pending, approve, semua
      if (approvalStatus === 'pending') {
        params.append('status', 'pending');
      } else if (approvalStatus === 'approved') {
        params.append('status', 'approved');
      } else {
        params.append('status', 'semua');
      }

      // Date Filtering: Priority to startDate/endDate, otherwise year/month
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        params.append('year', exportYear);
        if (exportMonth) params.append('month', exportMonth);
      }

      url += params.toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ...(localStorage.getItem('token') && { Authorization: `${localStorage.getItem('token')}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengekspor data');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const filename = dateRange && dateRange[0] && dateRange[1]
        ? `DeliveryOrder_${dateRange[0].format('YYYYMMDD')}_${dateRange[1].format('YYYYMMDD')}.xlsx`
        : `DeliveryOrder_${exportYear}${exportMonth ? `_${exportMonth}` : ''}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      message.success('Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Gagal mengekspor data');
    } finally {
      setExportLoading(false);
    }
  };

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchDeliveryOrders();
  }, [approvalStatus, year, month, dateRange, brand, selectedCompany, searchText, customerName, currentPage, userRole]);

  // Handle table pagination
  const handleTableChange = (pagination) => {
    console.log('Table Change:', { current: pagination.current, pageSize: pagination.pageSize });
    setCurrentPage(pagination.current);
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_, record) => record.no,
    },
    {
      title: 'Kode DO',
      dataIndex: 'code_delivery_order',
      key: 'code_delivery_order',
      width: 150,
      render: (text, record) => (
        <Link
          to={`/dashboard/delivery-order/detail/${record.key}`}
          style={{ color: '#1890ff', textDecoration: 'underline', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.target.style.color = '#40a9ff')}
          onMouseLeave={(e) => (e.target.style.color = '#1890ff')}
        >
          {text}
        </Link>
      ),
    },
    {
      title: 'No Order',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 120,
    },
    {
      title: 'Nama Customer',
      dataIndex: 'nama_customer',
      key: 'nama_customer',
      width: 140,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: 'Perusahaan',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 140,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 90,
      render: (text) => <Tag color={text === 'AUTO' ? 'blue' : 'green'}>{text || '-'}</Tag>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 110,
      render: (value) => `Rp ${Number(value).toLocaleString('id-ID')}`,
    },
    {
      title: 'Create Date',
      dataIndex: 'created_date',
      key: 'created_date',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: 'Reference No',
      dataIndex: 'no_referensi',
      key: 'no_referensi',
      width: 140,
      render: (text) => text || '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_shipped',
      key: 'is_shipped',
      width: 120,
      render: (isShipped) => (
        <Tag color={isShipped ? 'green' : 'orange'}>
          {isShipped ? 'Dikirim' : 'Belum Dikirim'}
        </Tag>
      ),
    },
    {
      title: 'Approval',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 100,
      render: (text) => (
        <Tag color={text === 'approved' ? 'green' : text === 'rejected' ? 'red' : 'orange'}>
          {text || '-'}
        </Tag>
      ),
    },
    {
      title: 'Sales',
      dataIndex: 'sales_name',
      key: 'sales_name',
      width: 100,
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: 'Approve Date',
      dataIndex: 'approval_date',
      key: 'approval_date',
      width: 160,
      render: (text) => {
        if (!text) return 'Not approved';
        const d = dayjs(text);
        return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : text;
      },
    },
    {
      title: 'INV',
      dataIndex: 'isInvoice',
      key: 'isInvoice',
      width: 70,
      align: 'center',
      render: (isInvoice) => (
        <span>
          {isInvoice ? (
            <FileDoneOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          ) : (
            <FileExclamationOutlined style={{ color: '#f5222d', fontSize: '18px' }} />
          )}
        </span>
      ),
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Delivery Order
            </Title>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between mb-4">
              <div className="flex flex-wrap items-end gap-2 flex-grow">
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Rentang Tanggal</label>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      console.log('RangePicker onChange dates:', dates);
                      setDateRange(dates);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-[250px]"
                    placeholder={['Mulai', 'Selesai']}
                    allowClear
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Tahun</label>
                  <Select
                    value={year}
                    onChange={(value) => {
                      setDateRange(null);
                      setYear(value);
                      setCurrentPage(1);
                    }}
                    style={{ width: 100 }}
                    className="w-full sm:w-[110px]"
                    allowClear
                    placeholder="Pilih Tahun"
                  >
                    {generateYears().map((y) => (
                      <Option key={y} value={y}>{y}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Bulan</label>
                  <Select
                    value={month}
                    onChange={(value) => {
                      // Clear explicit dateRange when changing month-only selection
                      setDateRange(null);
                      setMonth(value);
                      setCurrentPage(1);
                    }}
                    style={{ width: 120 }}
                    className="w-full sm:w-[130px]"
                    allowClear
                    placeholder="Pilih Bulan"
                  >
                    {generateMonths().map((m) => (
                      <Option key={m.value} value={m.value}>{m.label}</Option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Brand</label>
                  <Select
                    value={brand}
                    onChange={setBrand}
                    style={{ width: 110 }}
                    className="w-full sm:w-[120px]"
                    allowClear
                    placeholder="Semua"
                    options={brandOptions}
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Perusahaan</label>
                  <Select
                    value={selectedCompany}
                    onChange={setSelectedCompany}
                    style={{ width: 220 }}
                    className="w-full sm:w-[250px]"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Semua"
                    loading={companyList.length === 0}
                    dropdownStyle={{ width: 500 }}
                    options={[{ value: '', label: 'Semua' }, ...companyList.map(company => ({ value: company.company_name, label: company.company_name }))]}
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Nama Customer</label>
                  <Search
                    placeholder="Cari nama customer"
                    allowClear
                    onSearch={handleCustomerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    style={{ width: 180 }}
                    className="w-full sm:w-[200px]"
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Approval</label>
                  <Select
                    value={approvalStatus || 'all'}
                    style={{ width: 140 }}
                    onChange={(value) => {
                      setApprovalStatus(value);
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'Semua Approval' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                  />
                </div>
                <div className="flex flex-col w-full sm:w-auto">
                  <label className="font-medium mb-1">Cari</label>
                  <Search
                    placeholder="Cari kode, resi, referensi"
                    allowClear
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 220 }}
                    className="w-full sm:w-[250px]"
                  />
                </div>
              </div>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                loading={exportLoading}
                style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                className="w-full sm:w-auto"
              >
                Export Excel
              </Button>
            </div>
            <Table
              columns={columns}
              dataSource={deliveryOrders}
              rowKey="id_delivery_order"
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalData,
                showSizeChanger: false,
              }}
              onChange={handleTableChange}
              scroll={{ x: false }}
              className="ant-table-custom"
            />
          </div>
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
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default DeliveryOrder;
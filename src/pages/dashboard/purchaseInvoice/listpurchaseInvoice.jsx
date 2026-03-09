import React, { useState, useEffect } from 'react';
import { Table, Button, Spin, Modal, Tooltip, Space, Card, Typography, Empty, Input } from 'antd';
import { DeleteOutlined, PlusOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Search } = Input;

const PurchaseInvoiceList = () => {
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const navigate = useNavigate();

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/nimda/purchase-invoice/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add any necessary authentication headers here, e.g., Authorization: Bearer <token>
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data dari API');
      }

      const result = await response.json();
      const apiData = result.data || [];

      const formattedData = apiData.map((item, index) => {
        const details = item.tb_purchase_invoice_details || [];
        let total = 0;

        if (details.length > 0) {
          total = details.reduce((sum, detail) => sum + parseFloat(detail.total_price || 0), 0);
        }

        return {
          key: item.id_purchase_invoice,
          no: index + 1,
          kodeInvoice: item.transaction_no || `INV-${item.id_purchase_invoice}`,
          tglInvoice: new Date(item.transaction_date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          supplierName: item.person_name || '-',
          total: `Rp. ${total.toLocaleString('id-ID')}`,
          status: item.is_shipped || false,
          receiveNotes: item.is_received || false,
          id_purchase_invoice: item.id_purchase_invoice,
          rawDate: item.transaction_date,
        };
      });

      const sortedData = formattedData
        .sort((a, b) => b.id_purchase_invoice - a.id_purchase_invoice)
        .map((item, index) => ({
          ...item,
          no: index + 1,
        }));

      setDataSource(sortedData);
      setFilteredData(sortedData);
      setTotalData(sortedData.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memproses data dari API. Silakan coba lagi.');
      setDataSource([]);
      setFilteredData([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = dataSource.filter((item) => {
      const kode = item.kodeInvoice?.toLowerCase() || '';
      const tanggal = item.tglInvoice?.toLowerCase() || '';
      const supplier = item.supplierName?.toLowerCase() || '';
      const total = item.total?.toLowerCase() || '';
      const status = item.status ? 'dikirim' : 'belum dikirim';
      const receiveStatus = item.receiveNotes ? 'sudah diterima' : 'belum diterima';
      return (
        kode.includes(value.toLowerCase()) ||
        tanggal.includes(value.toLowerCase()) ||
        supplier.includes(value.toLowerCase()) ||
        total.includes(value.toLowerCase()) ||
        status.includes(value.toLowerCase()) ||
        receiveStatus.includes(value.toLowerCase())
      );
    });
    setFilteredData(filtered);
    setTotalData(filtered.length);
    setCurrentPage(1);
  };

  const handleViewDetail = (id_purchase_invoice) => {
    navigate(`/dashboard/purchaseinvoice/order/detail/${id_purchase_invoice}`);
  };

  const handleDeleteInvoice = (id_purchase_invoice) => {
    Modal.confirm({
      title: 'Konfirmasi Hapus',
      content: `Apakah Anda yakin ingin menghapus purchase invoice dengan ID ${id_purchase_invoice}?`,
      okText: 'Hapus',
      cancelText: 'Batal',
      okButtonProps: {
        style: { backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }, // Green color
      },
      onOk: async () => {
        setLoading(true);
        try {
          const response = await fetch(`${baseUrl}/nimda/purchase-invoice/${id_purchase_invoice}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              // Add any necessary authentication headers here, e.g., Authorization: Bearer <token>
            },
          });

          if (!response.ok) {
            throw new Error('Gagal menghapus purchase invoice dari API');
          }

          // Update state to remove the deleted invoice
          setDataSource((prevData) => prevData.filter((item) => item.id_purchase_invoice !== id_purchase_invoice));
          setFilteredData((prevData) => prevData.filter((item) => item.id_purchase_invoice !== id_purchase_invoice));
          setTotalData((prevData) => prevData.length - 1);

          Modal.success({
            content: 'Purchase invoice berhasil dihapus',
            okButtonProps: {
              style: { backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }, // Green color for OK button
            },
          });
        } catch (error) {
          console.error('Error deleting invoice:', error);
          Modal.error({
            title: 'Error',
            content: 'Gagal menghapus purchase invoice. Silakan coba lagi.',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleTambahPengajuan = () => {
    navigate('/dashboard/purchaseinvoice/add');
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const columnsInvoice = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Kode Invoice',
      dataIndex: 'kodeInvoice',
      key: 'kodeInvoice',
      width: 150,
      render: (text, record) => (
        <span
          className="text-blue-500 cursor-pointer hover:underline"
          onClick={() => handleViewDetail(record.id_purchase_invoice)}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Nama Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 200,
      render: (text) => (
        <Tooltip title={text}>
          <span
            className="text-gray-600"
            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Tanggal',
      dataIndex: 'tglInvoice',
      key: 'tglInvoice',
      width: 120,
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      align: 'right',
      render: (text) => <span className="text-green-600">{text}</span>,
    },
    // {
    //   title: 'Note',
    //   dataIndex: 'receiveNotes',
    //   key: 'receiveNotes',
    //   width: 100,
    //   align: 'center',
    //   render: (receiveNotes) => (
    //     <Tooltip title={receiveNotes ? 'Sudah Diterima' : 'Belum Diterima'}>
    //       {receiveNotes ? (
    //         <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
    //       ) : (
    //         <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: '14px' }} />
    //       )}
    //     </Tooltip>
    //   ),
    // },
    // {
    //   title: 'Aksi',
    //   key: 'action',
    //   width: 100,
    //   align: 'center',
    //   render: (_, record) => (
    //     <Space size="middle">
    //       <Button
    //         type="primary"
    //         danger
    //         onClick={() => handleDeleteInvoice(record.id_purchase_invoice)}
    //         icon={<DeleteOutlined />}
    //         className="rounded-md text-xs px-3 py-0"
    //         size="middle"
    //       />
    //     </Space>
    //   ),
    // },
  ];

  return (
    <Card bordered={false} className="shadow-md rounded-lg w-full">
      <div className="p-3 m-0 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
            Daftar Purchase Invoice
          </Title>
          <div className="flex gap-2">
            <Search
              placeholder="Cari berdasarkan kode, tanggal, supplier, total, status, atau penerimaan"
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
            {/* <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleTambahPengajuan}
              className="rounded-md text-xs px-3 py-0"
            >
              Tambah
            </Button> */}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3">
          <span className="text-red-600 text-xs">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Spin size="large" tip="Memuat data..." />
        </div>
      ) : filteredData.length === 0 ? (
        <Empty description="Tidak ada data purchase invoice" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={filteredData}
          columns={columnsInvoice}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalData,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            responsive: true,
          }}
          scroll={{ x: false }}
          rowClassName="hover:bg-gray-50"
          className="ant-table-custom"
          size="middle"
          onChange={handleTableChange}
        />
      )}

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
  );
};

export default PurchaseInvoiceList;
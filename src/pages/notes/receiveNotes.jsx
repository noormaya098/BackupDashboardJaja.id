import React, { useState, useEffect } from 'react';

import { Button, Table, Space, Typography, notification, Modal, Input, Select, Card, ConfigProvider } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;

const ReceiveNotes = () => {
  const [receiveNotes, setReceiveNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const navigate = useNavigate();

  // Fetch receive notes
  useEffect(() => {
    const fetchReceiveNotes = async (brand = 'all') => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        const url = brand === 'all'
          ? `${baseUrl}/nimda/receive-notes`
          : `${baseUrl}/nimda/receive-notes?brand=${brand.toLowerCase()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          const sortedData = result.data.sort((a, b) => b.id_receive_note - a.id_receive_note);
          setReceiveNotes(sortedData);
          setFilteredNotes(sortedData);
          setTotalData(result.data.length);
        } else {
          throw new Error(result.message || 'Gagal mengambil data receive notes.');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Data',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceiveNotes(selectedBrand);
  }, [selectedBrand]);

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = receiveNotes.filter((note) => {
      const code = note.receive_note_no?.toLowerCase() || '';
      const tracking = note.tracking_no?.toLowerCase() || '';
      const address = note.shipping_address?.toLowerCase() || '';
      const date = note.receive_note_date?.toLowerCase() || '';
      const remarks = note.remarks?.toLowerCase() || '';
      const brand = note.brand?.toLowerCase() || '';
      return (
        code.includes(value.toLowerCase()) ||
        tracking.includes(value.toLowerCase()) ||
        address.includes(value.toLowerCase()) ||
        date.includes(value.toLowerCase()) ||
        remarks.includes(value.toLowerCase()) ||
        brand.includes(value.toLowerCase())
      );
    });
    setFilteredNotes(filtered);
    setTotalData(filtered.length);
    setCurrentPage(1);
  };

  const handleBrandChange = (value) => {
    setSelectedBrand(value);
    setSearchText('');
    setCurrentPage(1);
  };

  // Handle delete dengan konfirmasi
  const showDeleteConfirm = (id_receive_note) => {
    confirm({
      title: 'Konfirmasi Hapus',
      content: `Apakah Anda yakin ingin menghapus Receive Note dengan ID ${id_receive_note}?`,
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
          }

          const response = await fetch(`${baseUrl}/nimda/receive-notes/${id_receive_note}/delete`, {
            method: 'DELETE',
            headers: {
              Authorization: `${token}`,
            },
          });

          const result = await response.json();
          if (response.ok) {
            setReceiveNotes(receiveNotes.filter(note => note.id_receive_note !== id_receive_note));
            setFilteredNotes(filteredNotes.filter(note => note.id_receive_note !== id_receive_note));
            notification.success({
              message: 'Receive Note Berhasil Dihapus',
              description: `Receive Note dengan ID ${id_receive_note} telah dihapus.`,
            });
          } else {
            throw new Error(result.message || 'Gagal menghapus receive note.');
          }
        } catch (error) {
          notification.error({
            message: 'Gagal Menghapus Receive Note',
            description: error.message,
          });
        }
      },
      onCancel() {
        // Tidak melakukan apa-apa jika dibatalkan
      },
    });
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleNew = () => {
    navigate('/dashboard/notes/create-notes');
  };

  const columns = [
    {
      title: 'No',
      key: 'index',
      width: 50,
      align: 'center',
      fixed: 'left',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Kode Receive Note',
      dataIndex: 'receive_note_no',
      key: 'receive_note_no',
      width: 140,
      fixed: 'left',
      render: (text, record) => (
        <Link
          to={`/dashboard/notes/detail-order/${record.id_receive_note}`}
          className="text-blue-500 hover:text-blue-700"
        >
          {text}
        </Link>
      ),
    },
    {
      title: 'Nomor Resi',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      width: 100,
      render: (text) => (
        <span>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Alamat Pengiriman',
      dataIndex: 'shipping_address',
      key: 'shipping_address',
      width: 180,
      render: (text) => {
        const maxLength = 40;
        if (!text) {
          return <span style={{ color: '#888' }}>Tidak ada alamat</span>;
        }
        const shortText = text.length > maxLength
          ? `${text.substring(0, maxLength)}...`
          : text;
        return (
          <div
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            }}
          >
            {shortText}
          </div>
        );
      },
    },
    {
      title: 'Tanggal',
      dataIndex: 'receive_note_date',
      key: 'receive_note_date',
      width: 100,
      render: (text) => (
        <span>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Catatan',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 120,
      render: (text) => (
        <div
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {text || '-'}
        </div>
      ),
    },
    // {
    //   title: 'Aksi',
    //   key: 'action',
    //   width: 100,
    //   align: 'center',
    //   render: (_, record) => (
    //     <Space size="middle" className="flex flex-col sm:flex-row">
    //       <Button
    //         danger
    //         icon={<DeleteOutlined />}
    //         onClick={() => showDeleteConfirm(record.id_receive_note)}
    //       >
    //         Hapus
    //       </Button>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Receive Notes
            </Title>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
              <div className="w-full sm:w-auto sm:min-w-[120px]">
                <Select
                  value={selectedBrand}
                  onChange={handleBrandChange}
                  style={{ width: '100%' }}
                  size="middle"
                >
                  <Option value="all">Semua Brand</Option>
                  <Option value="JAJAID">JAJAID</Option>
                  <Option value="AUTO">AUTO</Option>
                </Select>
              </div>
              <div className="flex-1 min-w-0">
                <Search
                  placeholder="Cari berdasarkan kode, resi, alamat, tanggal, atau catatan"
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={filteredNotes}
                rowKey="id_receive_note"
                loading={loading}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalData,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showQuickJumper: false,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} dari ${total} item`,
                  responsive: true,
                  size: 'small',
                }}
                onChange={handleTableChange}
                scroll={{ x: 800 }}
                className="ant-table-custom"
                size="small"
              />
            </div>
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

export default ReceiveNotes;
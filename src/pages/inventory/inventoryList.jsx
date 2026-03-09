import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Card, Typography, Button, Select } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const InventoryList = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [brand, setBrand] = useState('jajaid');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchInventories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/nimda/inventory/movements?limit=10&page=${page}&brand=${brand}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      if (result.status) {
        setInventories(result.data);
        setTotalData(result.totalData);
      } else {
        throw new Error(result.message || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err.message);
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
    // eslint-disable-next-line
  }, [page, keyword, brand]);

  const columns = [
    {
      title: 'No',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => (page - 1) * 10 + index + 1,
    },
    {
      title: 'Nama Produk',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text) => <span className="font-semibold text-blue-600 truncate block">{text}</span>,
    },
    {
      title: 'Tipe Pergerakan',
      dataIndex: 'movement_type',
      key: 'movement_type',
      render: (text) => (
        <span className={text === 'in' ? 'text-green-600' : 'text-red-600'}>
          {text === 'in' ? 'Masuk' : 'Keluar'}
        </span>
      ),
    },
    {
      title: 'Jumlah',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Satuan',
      dataIndex: 'unit',
      key: 'unit',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Kode Batch',
      dataIndex: 'batch_code',
      key: 'batch_code',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    },
  ];

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  const handleBrandChange = (value) => {
    setBrand(value);
    setPage(1);
  };

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card className="">
        <div className="p-3 m-0 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Pergerakan Inventory
            </Title>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Space
            direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
            className="w-full mb-4 gap-4"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Select
              value={brand}
              onChange={handleBrandChange}
              style={{ width: 120 }}
              className="rounded-full shadow-sm"
            >
              <Option value="jajaid">JajaID</Option>
              <Option value="auto">Auto</Option>
            </Select>
            <Search
              placeholder="Cari inventaris..."
              allowClear
              onSearch={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="rounded-full shadow-sm"
              style={{ width: '100%', maxWidth: '300px', height: '40px' }}
            />
          </Space>

          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            dataSource={inventories}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: 10,
              total: totalData,
              onChange: (currentPage) => setPage(currentPage),
              showSizeChanger: false,
              className: 'flex justify-center',
            }}
            scroll={{ x: 'max-content' }}
            className="rounded-lg"
            rowClassName="hover:bg-gray-50 transition-colors duration-200"
          />
        </div>
      </Card>
    </div>
  );
};

export default InventoryList;
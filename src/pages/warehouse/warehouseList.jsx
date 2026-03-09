import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Card, Typography, Button } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Search } = Input;

const WarehouseList = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${baseUrl}/nimda/warehouse/get-warehouse?page=${page}&keyword=${keyword}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Tambahkan header autentikasi jika diperlukan
            // 'Authorization': `${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.code === 200) {
        setWarehouses(result.data);
        setTotalData(result.data.length); // Ganti dengan total dari API jika tersedia
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
    fetchWarehouses();
  }, [page, keyword]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Gudang ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${baseUrl}/nimda/warehouse/delete/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Tambahkan header autentikasi jika diperlukan
            // 'Authorization': `${token}`,
          },
        });
        const result = await response.json();
        if (result.code === 200) {
          Swal.fire('Berhasil', result.message || 'Gudang telah dihapus', 'success');
          fetchWarehouses();
        } else {
          throw new Error(result.message || 'Gagal menghapus gudang');
        }
      } catch (err) {
        Swal.fire('Error', err.message || 'Gagal menghapus gudang', 'error');
      }
    }
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => (page - 1) * 10 + index + 1,
    },
    {
      title: 'Nama Gudang',
      dataIndex: 'name_warehouse',
      key: 'name_warehouse',
      sorter: (a, b) => a.name_warehouse.localeCompare(b.name_warehouse),
      render: (text, record) => (
        <span
          className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer underline"
          onClick={() => navigate(`/dashboard/warehouse/detail-warehouse/${record.id_warehouse}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Kode Gudang',
      dataIndex: 'code_warehouse',
      key: 'code_warehouse',
      responsive: ['md'], // Hide on mobile
      render: (text) =>
        text ? <span className="text-gray-600">{text}</span> : <span className="text-gray-400 italic">Tidak Ada</span>,
    },
    {
      title: 'Alamat',
      key: 'address',
      responsive: ['lg'], // Hide on mobile and tablet
      render: (_, record) => {
        const fullAddress = [record.address_warehouse, record.city, record.province]
          .filter(Boolean)
          .join(', ');
        return fullAddress ? (
          <span className="text-gray-700 truncate block">{fullAddress}</span>
        ) : (
          <span className="text-gray-400 italic">Tidak Ada</span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      responsive: ['sm'], // Hide on smaller screens
      render: (isActive) => (
        <span className={isActive ? 'text-green-600' : 'text-red-600'}>
          {isActive ? 'Aktif' : 'Non-Aktif'}
        </span>
      ),
    },
    {
      title: 'Aksi',
      dataIndex: 'id_warehouse',
      key: 'aksi',
      width: 220,
      render: (id) => (
        <Space size="small" direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
          <Button
            type="primary"
            onClick={() => navigate(`/dashboard/warehouse/edit-warehouse/${id}`)}
            className="bg-blue-500 border-blue-500 rounded-md w-full sm:w-16"
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => handleDelete(id)}
            className="rounded-md w-full sm:w-16"
          >
            Hapus
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card className="">
        <div className="p-3 m-0 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Warehouse
            </Title>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Space
            direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
            className="w-full mb-4 gap-4"
            style={{ display: 'flex', justifyContent: 'space-between' }}
          >
            <Search
              placeholder="Cari gudang..."
              allowClear
              onSearch={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="rounded-full shadow-sm"
              style={{ width: '100%', maxWidth: '300px', height: '40px' }}
            />
            <Button
              type="primary"
              onClick={() => navigate('/dashboard/warehouse/create-warehouse')}
              className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
            >
              Tambah Gudang
            </Button>
          </Space>

          {error && (
            <div className="text-red-500 text-center mb-4">
              {error}
            </div>
          )}

          <Table
            columns={columns}
            dataSource={warehouses}
            rowKey="id_warehouse"
            loading={loading}
            pagination={{
              current: page,
              pageSize: 10,
              total: totalData,
              onChange: (currentPage) => setPage(currentPage),
              showSizeChanger: false,
              className: 'flex justify-center',
            }}
            scroll={{ x: 'max-content' }} // Enable horizontal scroll on mobile
            className="rounded-lg"
            rowClassName="hover:bg-gray-50 transition-colors duration-200"
          />
        </div>
      </Card>
    </div>
  );
};

export default WarehouseList;
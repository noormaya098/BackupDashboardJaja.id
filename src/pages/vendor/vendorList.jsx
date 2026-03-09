import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Card, Typography, Button } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';


const { Title } = Typography;
const { Search } = Input;

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const fetchVendors = async (currentPage, searchKeyword = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://apidev.jaja.id/nimda/vendor/get-vendor`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: 10,
          keyword: searchKeyword,
        },
      });

      const { data, totalData } = response.data;
      setVendors(data);
      setTotalData(totalData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      Swal.fire('Error', 'Gagal mengambil data vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(page, keyword);
  }, [page, keyword]);

  const handleDelete = async (id_vendor) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Vendor ini akan dihapus secara permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`https://apidev.jaja.id/nimda/vendor/delete/${id_vendor}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire('Berhasil', 'Vendor telah dihapus', 'success');
          setVendors(vendors.filter((vendor) => vendor.id_vendor !== id_vendor));
        } catch (error) {
          Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus vendor', 'error');
        }
      }
    });
  };

  const columns = [
    {
      title: 'No',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nama Vendor',
      dataIndex: 'display_name',
      key: 'display_name',
      sorter: (a, b) => a.display_name.localeCompare(b.display_name),
      render: (text) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: 'Nama Perusahaan',
      dataIndex: 'company_name',
      key: 'company_name',
      responsive: ['md'], // Hide on mobile
      render: (text) =>
        text ? <span className="text-gray-600">{text}</span> : <span className="text-gray-400 italic">Tidak Ada</span>,
    },
    {
      title: 'Telepon',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['sm'], // Hide on smaller screens
      render: (text) =>
        text ? <span className="text-gray-700">{text}</span> : <span className="text-gray-400 italic">-</span>,
    },
    {
      title: 'Alamat',
      dataIndex: 'address',
      key: 'address',
      responsive: ['lg'], // Hide on mobile and tablet
      render: (text) =>
        text ? (
          <span className="text-gray-700 truncate block">{text}</span>
        ) : (
          <span className="text-gray-400 italic">Tidak Ada</span>
        ),
    },
    {
      title: 'Aksi',
      dataIndex: 'id_vendor',
      key: 'aksi',
      width: 220,
      render: (id_vendor) => (
        <Space size="small" direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
          <Button
            type="primary"
            onClick={() => navigate(`/dashboard/vendor/${id_vendor}`)}
            className="bg-green-500 border-green-500 rounded-md w-full sm:w-16"
          >
            Detail
          </Button>
          <Button
            type="primary"
            onClick={() => navigate(`/dashboard/vendor/edit/${id_vendor}`)}
            className="bg-blue-500 border-blue-500 rounded-md w-full sm:w-16"
          >
            Edit
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => handleDelete(id_vendor)}
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
              Daftar Vendor
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
              placeholder="Cari vendor..."
              allowClear
              onSearch={handleSearch}
              prefix={<SearchOutlined className="text-gray-400" />}
              className="rounded-full shadow-sm"
              style={{ width: '100%', maxWidth: '300px', height: '40px' }}
            />
            <Button
              type="primary"
              onClick={() => navigate('/dashboard/vendor/add')}
              className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"
            >
              Tambah Vendor
            </Button>
          </Space>
  
          <Table
            columns={columns}
            dataSource={vendors}
            rowKey="id_vendor"
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

export default VendorList;
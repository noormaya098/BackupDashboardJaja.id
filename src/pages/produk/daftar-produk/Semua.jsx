import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input, Table, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  PlusIcon,
  PencilIcon,
  InboxArrowDownIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { baseUrl } from '@/configs';

function Semua({ status }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/sign-in');
          return;
        }

        let apiUrl = `${baseUrl}/nimda/master_product?page=${currentPage}&limit=${pageLimit}`;
        if (searchTerm) {
          apiUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: `${token}`,
          },
        });

        const productsData = response.data.data;
        setProducts(productsData);
        setTotalData(response.data.totalData || response.data.totalPages * pageLimit);
        setLoading(false);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/auth/sign-in');
        } else {
          setError('Gagal mengambil produk');
        }
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate, currentPage, pageLimit, searchTerm]);

  const displayProducts = status
    ? products.filter((product) => product.status === status)
    : products;

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDetail = (id) => {
    navigate(`/dashboard/produk/daftar-produk/edit-produk/${id}`);
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Anda tidak akan dapat mengembalikan ini!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus saja!',
      cancelButtonText: 'Batalkan',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/auth/sign-in');
            return;
          }

          await axios.delete(`${baseUrl}/nimda/master_product/delete/${id}`, {
            headers: {
              Authorization: `${token}`,
            },
          });

          Swal.fire('Dihapus!', 'Item berhasil dihapus.', 'success');
          setProducts(products.filter((product) => product.id !== id));
        } catch (err) {
          Swal.fire('Gagal!', err.response?.data?.message || 'Terjadi kesalahan saat menghapus produk', 'error');
        }
      }
    });
  };

  const handleViewDetail = (id) => {
    navigate(`/dashboard/produk/daftar-produk/detail/${id}`);
  };

  const handleAddProduct = () => {
    navigate('/dashboard/produk/daftar-produk/add');
  };

  const columns = [
    {
      title: 'No.',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => (currentPage - 1) * pageLimit + index + 1,
    },
    {
      title: 'Nama Produk',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="truncate block">{text || 'N/A'}</span>,
    },
    {
      title: 'Kode Produk',
      dataIndex: 'product_code',
      key: 'product_code',
      render: (text) => text || '-',
    },
    {
      title: 'Harga Jual',
      dataIndex: 'sell_price',
      key: 'sell_price',
      render: (text) => (text ? `Rp. ${parseFloat(text).toLocaleString('id-ID')}` : '-'),
    },
    {
      title: 'Harga Beli',
      dataIndex: 'buy_price',
      key: 'buy_price',
      render: (text) => (text ? `Rp. ${parseFloat(text).toLocaleString('id-ID')}` : '-'),
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      render: (text) => text || '0',
    },
    {
      title: 'Satuan',
      dataIndex: 'unit',
      key: 'unit',
      render: (text) => text || '-',
    },
    {
      title: 'Kategori',
      dataIndex: 'product_category',
      key: 'product_category',
      render: (text) => <span className="truncate block">{text || 'N/A'}</span>,
    },
    {
      title: 'Aksi',
      dataIndex: 'id',
      key: 'aksi',
      width: 220,
      render: (id) => (
        <Space size="small" direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}>
          <Button
            type="primary"
            onClick={() => handleViewDetail(id)}
            className="bg-green-500 border-green-500 rounded-md w-full sm:w-16"
          >
            View
          </Button>
          <Button
            type="primary"
            onClick={() => handleDetail(id)}
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

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <>
      <div className="w-full px-4">
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4"
        >
          <Space
            direction={window.innerWidth < 640 ? 'vertical' : 'horizontal'}
            size="middle"
            className="w-full sm:w-auto"
          >
            <Input
              placeholder="Cari produk..."
              className="h-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%', maxWidth: '300px' }}
            />
            <div className="flex items-center gap-2">
              <span>Limit:</span>
              <select
                value={pageLimit}
                onChange={(e) => setPageLimit(parseInt(e.target.value))}
                className="h-10 border rounded-md px-2"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </Space>
          <Button
            type="primary"
            className="h-10 bg-green-500 hover:bg-green-600 text-white flex items-center w-full sm:w-auto"
            onClick={handleAddProduct}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>
      <div className="px-4">
        <Table
          columns={columns}
          dataSource={displayProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalData,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
            className: 'flex justify-center',
          }}
          scroll={{ x: 'max-content' }}
          className="rounded-lg"
          rowClassName="hover:bg-gray-50 transition-colors duration-200"
        />
      </div>
    </>
  );
}

export default Semua;
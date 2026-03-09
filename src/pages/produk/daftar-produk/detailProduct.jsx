import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spin, Descriptions, Table, Tag, Avatar, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  UnorderedListOutlined,
  EditOutlined,
  ProductOutlined,
  DollarOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  TagOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const DetailProduct = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth/sign-in');
        return;
      }

      const response = await axios.get(`${baseUrl}/nimda/master_product/detail/${id}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      if (response.data.code === 200) {
        setProduct(response.data.data);
        // Map API history to table format
        const mappedHistory = response.data.data.history.map((item, index) => ({
          key: item.id,
          no: index + 1,
          admin: 'Admin Jaja', // Placeholder, as API doesn't provide admin name
          type: item.movement_type === 'in' ? 'In' : item.movement_type === 'out' ? 'Out' : 'Adjustment',
          qty: parseFloat(item.quantity).toFixed(2),
          date: new Date(item.created_at).toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }));
        setHistoryData(mappedHistory);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil detail produk');
      }
    } catch (error) {
      Swal.fire('Error', error.message || 'Gagal mengambil detail produk', 'error');
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/produk/daftar-produk/edit-produk/${id}`);
  };

  const handleExportProduct = async () => {
    if (!product?.id) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'ID produk tidak ditemukan',
        confirmButtonColor: '#22c55e',
      });
      return;
    }

    try {
      setExportLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        Swal.fire({
          icon: 'warning',
          title: 'Peringatan',
          text: 'Token tidak ditemukan, silakan login ulang',
          confirmButtonColor: '#22c55e',
        });
        navigate('/auth/sign-in');
        return;
      }

      console.log('Starting export for product ID:', product.id);

      const response = await axios.post(
        `${baseUrl}/nimda/master_product/export-product`,
        { id: product.id },
        {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Debug: Log response untuk melihat struktur data
      console.log('Export response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      // Selalu tampilkan alert berdasarkan response
      if (response.status === 200 || response.status === 201) {
        // Cek berbagai kemungkinan format response success
        const isSuccess = response.data && (
          response.data.code === 200 ||
          response.data.success === true ||
          response.data.status === 'success' ||
          (response.data.message && (
            response.data.message.toLowerCase().includes('success') ||
            response.data.message.toLowerCase().includes('berhasil') ||
            response.data.message.toLowerCase().includes('export')
          ))
        );

        if (isSuccess) {
          try {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil!',
              text: response.data.message || 'Export produk berhasil dilakukan!',
              confirmButtonColor: '#22c55e',
              confirmButtonText: 'OK'
            }).catch((swalError) => {
              console.error('SweetAlert2 success error:', swalError);
              alert('Berhasil! ' + (response.data.message || 'Export produk berhasil dilakukan!'));
            });
          } catch (swalError) {
            console.error('SweetAlert2 success failed:', swalError);
            alert('Berhasil! ' + (response.data.message || 'Export produk berhasil dilakukan!'));
          }
        } else {
          // Response 200 tapi tidak ada indikasi success yang jelas
          try {
            Swal.fire({
              icon: 'info',
              title: 'Informasi',
              text: response.data.message || 'Export produk telah diproses',
              confirmButtonColor: '#22c55e',
              confirmButtonText: 'OK'
            }).catch((swalError) => {
              console.error('SweetAlert2 info error:', swalError);
              alert('Informasi: ' + (response.data.message || 'Export produk telah diproses'));
            });
          } catch (swalError) {
            console.error('SweetAlert2 info failed:', swalError);
            alert('Informasi: ' + (response.data.message || 'Export produk telah diproses'));
          }
        }
      } else {
        // Handle API response that indicates failure
        const errorMessage = response.data?.message || response.data?.error || 'Export produk gagal';
        try {
          Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: errorMessage,
            confirmButtonColor: '#22c55e',
            confirmButtonText: 'OK'
          }).catch((swalError) => {
            console.error('SweetAlert2 response error:', swalError);
            alert('Gagal! ' + errorMessage);
          });
        } catch (swalError) {
          console.error('SweetAlert2 response failed:', swalError);
          alert('Gagal! ' + errorMessage);
        }
      }
    } catch (error) {
      console.error('Export product error:', error);
      console.log('Full error object:', error);

      // More comprehensive error handling
      let errorMessage = 'Export produk gagal';
      let errorTitle = 'Error';

      if (error.response) {
        // Server responded with error status
        console.log('Error response:', error.response);
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        console.log('Error response statusText:', error.response.statusText);
        const responseData = error.response.data;

        // Handle different error response formats - prioritize main message first
        if (responseData?.message) {
          // Use the main message from API response
          errorMessage = responseData.message;
        } else if (responseData?.error?.full_messages) {
          // Use full_messages if available
          if (Array.isArray(responseData.error.full_messages)) {
            errorMessage = responseData.error.full_messages.join(', ');
          } else {
            errorMessage = responseData.error.full_messages;
          }
        } else if (responseData?.error?.error_full_messages) {
          // Use error_full_messages as fallback
          if (Array.isArray(responseData.error.error_full_messages)) {
            errorMessage = responseData.error.error_full_messages.join(', ');
          } else {
            errorMessage = responseData.error.error_full_messages;
          }
        } else if (responseData?.error) {
          errorMessage = typeof responseData.error === 'string' ? responseData.error : JSON.stringify(responseData.error);
        } else {
          errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        }

        errorTitle = `Error ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        errorTitle = 'Koneksi Error';
      } else {
        // Something else happened
        errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
        errorTitle = 'Unknown Error';
      }

      console.log('About to show alert with:', { errorTitle, errorMessage });

      // Force show alert - try multiple methods
      const showAlert = () => {
        try {
          // Method 1: Try SweetAlert2
          if (typeof Swal !== 'undefined' && Swal.fire) {
            Swal.fire({
              icon: 'error',
              title: errorTitle,
              text: errorMessage,
              confirmButtonColor: '#22c55e',
              confirmButtonText: 'OK',
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then((result) => {
              console.log('SweetAlert2 closed:', result);
            }).catch((swalError) => {
              console.error('SweetAlert2 error:', swalError);
              // Fallback to native alert
              alert(`${errorTitle}: ${errorMessage}`);
            });
          } else {
            throw new Error('SweetAlert2 not available');
          }
        } catch (swalError) {
          console.error('SweetAlert2 failed:', swalError);
          // Fallback to native alert
          alert(`${errorTitle}: ${errorMessage}`);
        }
      };

      // Show alert immediately
      showAlert();
    } finally {
      setExportLoading(false);
    }
  };

  // Table columns for history
  const historyColumns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center'
    },
    {
      title: 'Admin',
      dataIndex: 'admin',
      key: 'admin',
      width: 140,
      render: (admin) => (
        <div className="flex items-center space-x-2">
          <Avatar size={28} style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>
            {admin.charAt(0)}
          </Avatar>
          <span className="text-sm font-medium">{admin}</span>
        </div>
      )
    },
    {
      title: 'Jenis',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (type) => (
        <Tag
          color={type === 'In' ? '#10b981' : type === 'Out' ? '#f59e0b' : '#6b7280'}
          style={{
            fontWeight: '600',
            fontSize: '12px',
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none'
          }}
        >
          {type === 'In' ? 'Masuk' : type === 'Out' ? 'Keluar' : 'Penyesuaian'}
        </Tag>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 100,
      align: 'center',
      render: (qty) => <span className="font-semibold text-gray-700">{qty}</span>
    },
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <CalendarOutlined style={{ fontSize: '12px' }} />
          <span>{date}</span>
        </div>
      )
    },
  ];

  const InfoCard = ({ icon, title, value, color = "blue" }) => (
    <div className={`bg-gradient-to-r from-${color}-50 to-${color}-100 p-4 rounded-xl border border-${color}-200`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 bg-${color}-500 rounded-lg text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <Spin size="large" />
              <p className="mt-4 text-gray-500">Memuat detail produk...</p>
            </div>
          </div>
        ) : product ? (
          <>
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => navigate(-1)}
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    className="hover:bg-blue-100 text-blue-600"
                    size="large"
                  />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">Detail Produk</h1>
                    <p className="text-gray-500">Informasi lengkap produk dan riwayat perubahan</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <Button
                    type="primary"
                    onClick={handleEdit}
                    icon={<EditOutlined />}
                    size="large"
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg w-full sm:w-auto"
                  >
                    Edit Produk
                  </Button>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    size="large"
                    loading={exportLoading}
                    onClick={handleExportProduct}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 w-full sm:w-auto"
                    disabled={exportLoading}
                  >
                    Export Product
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <InfoCard
                icon={<ProductOutlined />}
                title="Kode Produk"
                value={product.product_code || 'N/A'}
                color="blue"
              />
              <InfoCard
                icon={<BarChartOutlined />}
                title="Stok Tersedia"
                value={`${product.stock || '0'} ${product.unit || 'pcs'}`}
                color="green"
              />
              <InfoCard
                icon={<DollarOutlined />}
                title="Harga Jual"
                value={`Rp ${parseFloat(product.sell_price || 0).toLocaleString('id-ID')}`}
                color="emerald"
              />
              <InfoCard
                icon={<TagOutlined />}
                title="Kategori"
                value={product.product_category || 'N/A'}
                color="purple"
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Product Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <ProductOutlined className="text-blue-500 text-lg" />
                    <h3 className="text-lg font-semibold text-gray-700">Informasi Dasar</h3>
                  </div>
                  <Descriptions
                    column={1}
                    bordered
                    size="middle"
                    labelStyle={{
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#f8fafc',
                      color: '#374151'
                    }}
                    contentStyle={{
                      fontSize: '14px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <Descriptions.Item label="Nama Produk">
                      <span className="font-medium text-gray-800">{product.name || 'N/A'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Deskripsi">
                      <span className="text-gray-600">{product.description || 'Tidak ada deskripsi'}</span>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Pricing Information */}
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarOutlined className="text-green-500 text-lg" />
                    <h3 className="text-lg font-semibold text-gray-700">Informasi Harga</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 font-medium mb-1">Harga Jual</p>
                      <p className="text-xl font-bold text-green-700">
                        Rp {parseFloat(product.sell_price || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        Pajak: {product.default_sell_tax_name || 'Tidak ada'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600 font-medium mb-1">Harga Beli</p>
                      <p className="text-xl font-bold text-blue-700">
                        Rp {parseFloat(product.buy_price || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Pajak: {product.default_buy_tax_name || 'Tidak ada'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow"
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <ShoppingOutlined className="text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Status Produk</h3>
                    <Tag
                      color={product.stock > 0 ? '#22c55e' : '#ef4444'}
                      style={{
                        fontSize: '14px',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}
                    >
                      {product.stock > 0 ? 'Tersedia' : 'Stok Habis'}
                    </Tag>
                  </div>

                  {product.date_modified && (
                    <>
                      <Divider />
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Terakhir diperbarui</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(product.date_modified || product.date_added).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>

            <Card
              className="mt-8 shadow-md hover:shadow-lg transition-shadow"
              style={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <UnorderedListOutlined className="text-purple-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-700">Riwayat Produk</h3>
              </div>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table
                  columns={historyColumns}
                  dataSource={historyData}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: false,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} dari ${total} entri`
                  }}
                  rowKey="key"
                  className="custom-table"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                  scroll={{ x: 'max-content' }} // Enable horizontal scrolling
                />
              </div>
            </Card>
          </>
        ) : (
          <Card
            className="text-center shadow-md"
            style={{
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div>
              <ProductOutlined className="text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">Tidak ada data produk</h3>
              <p className="text-gray-400">Data produk yang Anda cari tidak ditemukan</p>
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          border-bottom: 2px solid #cbd5e1;
          font-weight: 600;
          color: #374151;
        }
        
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9;
        }
        
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default DetailProduct;
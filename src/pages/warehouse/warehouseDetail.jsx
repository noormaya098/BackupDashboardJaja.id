import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Spin, Space, Tag, Divider, notification, Table, Input } from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  BoxPlotOutlined,
  EnvironmentOutlined,
  BarcodeOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Title, Text } = Typography;
const { Search } = Input;

const WarehouseDetail = () => {
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [products, setProducts] = useState([]);
  const { id_warehouse } = useParams();
  const navigate = useNavigate();

  // Fetch warehouse details
  useEffect(() => {
    const fetchWarehouseDetail = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${baseUrl}/nimda/warehouse/${id_warehouse}/get-warehouse-detail`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const result = await response.json();
        if (result.code === 200) {
          setWarehouse(result.data);
        } else {
          throw new Error(result.message || 'Gagal mengambil data gudang');
        }
      } catch (error) {
        if (error.message.includes('not found')) {
          setWarehouse(null);
        } else {
          notification.error({
            message: 'Gagal Memuat Data',
            description: error.message || 'Terjadi kesalahan saat mengambil detail gudang.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseDetail();
  }, [id_warehouse]);

  // Fetch products and inventory movements
  useEffect(() => {
    const fetchData = async () => {
      setLoadingInventory(true);
      try {
        // Fetch master products
        const productResponse = await fetch(
          `${baseUrl}/nimda/master_product?limit=50000`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const productResult = await productResponse.json();
        if (productResult.code !== 200) {
          throw new Error(productResult.message || 'Gagal mengambil data produk');
        }
        setProducts(productResult.data);

        // Fetch inventory movements
        const inventoryResponse = await fetch(
          `${baseUrl}/nimda/warehouse/${id_warehouse}/inventory-movements?page=1`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const inventoryResult = await inventoryResponse.json();
        if (inventoryResult.code === 200 && inventoryResult.data) {
          const inventoryData = inventoryResult.data.map((item, index) => {
            const product = productResult.data.find(p => p.id === item.product_id) || {};
            return {
              key: item.id,
              no: index + 1,
              productName: product.name || 'Produk Tidak Dikenal',
              description: item.description || 'Tidak ada deskripsi',
              qty: parseFloat(item.quantity) || 0,
              type: item.movement_type || 'Unknown',
              doRn: item.reference || 'N/A',
            };
          });
          setTableData(inventoryData);
          setFilteredData(inventoryData);
        } else {
          throw new Error(inventoryResult.message || 'Gagal mengambil data inventory movements');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Data',
          description: error.message || 'Terjadi kesalahan saat mengambil data.',
        });
        setTableData([]);
        setFilteredData([]);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchData();
  }, [id_warehouse]);

  // Search function
  const handleSearch = (value) => {
    const filtered = tableData.filter(
      (item) =>
        item.productName.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase()) ||
        item.doRn.toLowerCase().includes(value.toLowerCase()) ||
        item.type.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  // Table columns
  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60,
    },
    {
      title: 'Nama Produk',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Deskripsi',
      dataIndex: 'description',
      key: 'description',
      responsive: ['md'], // Hide on mobile
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 80,
    },
    {
      title: 'Jenis',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag
          color={type === 'out' ? 'red' : type === 'in' ? 'green' : '#24b4c4'}
          style={{ fontWeight: '500' }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: 'Referensi',
      dataIndex: 'doRn',
      key: 'doRn',
      width: 120,
      responsive: ['md'], // Hide on mobile
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="py-8 px-6 shadow-md rounded-lg border-0">
          <div className="flex flex-col items-center">
            <Spin size="large" style={{ color: '#24b4c4' }} />
            <Text className="mt-3 text-gray-600">Memuat data gudang...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="py-8 px-8 shadow-md rounded-lg border-0">
          <div className="flex flex-col items-center">
            <Typography.Text type="danger" className="text-base font-medium">Data gudang tidak ditemukan</Typography.Text>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="mt-4 px-5 py-2 h-9 font-medium rounded-md border-0"
              style={{ backgroundColor: '#24b4c4', color: 'white' }}
            >
              Kembali
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const fullAddress = [warehouse.address_warehouse, warehouse.city, warehouse.province]
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      <Card
        className="shadow-md rounded-lg border-0"
        style={{ backgroundColor: 'white' }}
      >
        {/* Header dengan nama gudang */}
        <div className="flex items-center justify-between mb-5" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div className="flex items-center space-x-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 h-10 font-medium rounded-md border-0 hover:opacity-90 transition-all"
              style={{ backgroundColor: '#24b4c4', color: 'white' }}
            >
              Kembali
            </Button>
            <div className="flex items-center space-x-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg"
                style={{ backgroundColor: '#24b4c4' }}
              >
                <HomeOutlined className="text-lg text-white" />
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <Title level={4} className="m-0 text-gray-800" style={{ fontWeight: '600', lineHeight: '1.2', marginTop: '10px' }}>
                    {warehouse.name_warehouse}
                  </Title>
                </div>
                <Tag
                  className="px-2 py-2 text-xs font-medium rounded-md border-0 self-center"
                  style={{
                    backgroundColor: warehouse.is_active ? '#d4edda' : '#f8d7da',
                    color: warehouse.is_active ? '#155724' : '#721c24',
                    lineHeight: '1.2',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {warehouse.is_active ? 'Aktif' : 'Non-Aktif'}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card
            className="shadow-sm rounded-lg border-0"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
            size="small"
          >
            <div className="flex items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 mt-1"
                style={{ backgroundColor: '#e8f8f9' }}
              >
                <BarcodeOutlined style={{ color: '#24b4c4' }} />
              </div>
              <div className="flex-1">
                <Text className="text-gray-500 text-xs font-medium block mb-1">Kode Gudang</Text>
                <Tag
                  className="px-2 py-1 text-sm font-medium rounded-md border-0"
                  style={{ backgroundColor: '#24b4c4', color: 'white' }}
                >
                  {warehouse.code_warehouse}
                </Tag>
              </div>
            </div>
          </Card>

          <Card
            className="shadow-sm rounded-lg border-0"
            style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
            size="small"
          >
            <div className="flex items-start">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 mt-1"
                style={{ backgroundColor: '#e8f8f9' }}
              >
                <EnvironmentOutlined style={{ color: '#24b4c4' }} />
              </div>
              <div className="flex-1">
                <Text className="text-gray-500 text-xs font-medium block mb-1">Alamat Lengkap</Text>
                <div className="text-gray-800 text-sm font-medium leading-relaxed">
                  {fullAddress || 'Tidak ada alamat tersedia'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Product List Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <UnorderedListOutlined style={{ color: '#24b4c4', fontSize: '16px' }} />
              <Title level={5} className="m-0 text-gray-800" style={{ fontWeight: '600', marginTop: '7px' }}>
                Daftar Barang
              </Title>
            </div>
          </div>

          <Search
            placeholder="Cari berdasarkan nama produk, deskripsi, jenis, atau referensi"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="mb-4"
            style={{
              borderRadius: '6px',
              maxWidth: '400px'
            }}
          />

          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loadingInventory}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
              size: 'small'
            }}
            rowKey="key"
            className="rounded-lg overflow-hidden"
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
            size="small"
            scroll={{ x: 'max-content' }} // Enable horizontal scrolling
          />
        </div>
      </Card>
    </div>
  );
};

export default WarehouseDetail;
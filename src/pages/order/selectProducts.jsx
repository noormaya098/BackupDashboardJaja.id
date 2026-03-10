import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  notification,
  InputNumber,
  Typography,
  Input,
  Spin,
  Select,
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SelectProductsPageElse = () => {
  const { id_data } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { selectedProducts, orderDetails, isDirect } = state || {};

  const [products, setProducts] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [message, setMessage] = useState('');
  const [isShipped, setIsShipped] = useState(0);
  const [warehouseId, setWarehouseId] = useState(orderDetails?.warehouse_id || 5);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [referenceNo, setReferenceNo] = useState(orderDetails?.order_id || `REF-${id_data}`);
  const [shippingPrice, setShippingPrice] = useState(orderDetails?.biaya_ongkir || 0);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehouseLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/warehouse/get-warehouse`, {
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.code === 200 && response.data.data) {
          setWarehouses(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch warehouses');
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal mengambil data gudang. Menggunakan nilai default.',
        });
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!selectedProducts || !orderDetails) {
      notification.error({
        message: 'Error',
        description: 'Data produk atau order tidak tersedia.',
      });
      navigate(`/dashboard/order/detail-order/${id_data}`);
      return;
    }

    const fetchProductStocks = async () => {
      try {
        const token = localStorage.getItem('token');
        const allProducts = await fetchAllProducts(token);
          console.log('API Products:', allProducts.filter(p => [1, 2, 3, 4, 5].includes(parseInt(p.id))));
          const initialProducts = selectedProducts.map((product, index) => {
            const apiProduct = allProducts.find(
              ap => ap.id === (isDirect ? product.id : product.id_detail)
            );
            const stock = apiProduct ? apiProduct.stock : 0;
            // Keep the original price from the order, don't override with API price
            const orderPrice = product.price || 0;
            console.log(`Product ID: ${product.id}, Stock: ${stock}, Order Price: ${orderPrice}, Description: ${product.product_description}`);
            const isTenor = product.product_description?.toLowerCase().includes('tenor');
            const displayQty = isTenor ? product.qty : product.qty === 0 ? 1 : product.qty;
            return {
              ...product,
              key: product.id || index,
              stock,
              price: orderPrice, // Keep original order price
              remainingQty: product.qty,
              discount: product.discount || 0,
              discount_type: product.discount_type || 'percent',
              amount:
                product.discount_type === 'percent'
                  ? orderPrice * displayQty * (1 - (product.discount || 0) / 100)
                  : orderPrice * displayQty - (product.discount || 0),
            };
          });
          setProducts(initialProducts);
          setSelectedRowKeys(initialProducts.map(p => p.key));
      } catch (error) {
        console.error('Error fetching product stock:', error);
        const initialProducts = selectedProducts.map((product, index) => {
          const isTenor = product.product_description?.toLowerCase().includes('tenor');
          const displayQty = isTenor ? product.qty : product.qty === 0 ? 1 : product.qty;
          // Keep the original price from the order
          const orderPrice = product.price || 0;
          console.log(`Fallback - Product ID: ${product.id}, Order Price: ${orderPrice}, Description: ${product.product_description}`);
          return {
            ...product,
            key: product.id || index,
            stock: 0,
            price: orderPrice, // Keep original order price
            remainingQty: product.qty,
            discount: product.discount || 0,
            discount_type: product.discount_type || 'percent',
            amount:
              product.discount_type === 'percent'
                ? orderPrice * displayQty * (1 - (product.discount || 0) / 100)
                : orderPrice * displayQty - (product.discount || 0),
          };
        });
        setProducts(initialProducts);
        setSelectedRowKeys(initialProducts.map(p => p.key));
      }
    };

    fetchProductStocks();
  }, [selectedProducts, orderDetails, id_data, navigate, isDirect]);

  const handleQuantityChange = (productId, value) => {
    const product = products.find(p => p.id === productId);
    if (value < 0 || value > product.originalQty) {
      notification.warning({
        message: 'Invalid Quantity',
        description: `Quantity must be between 0 and ${product.originalQty}`,
      });
      return;
    }

    const isTenor = product.product_description?.toLowerCase().includes('tenor');
    const isDP = product.product_description?.toLowerCase().includes('dp');
    const adjustedQty = (isTenor || isDP) ? value : value === 0 ? 1 : value;

    setProducts(prev =>
      prev.map(product =>
        product.id === productId
          ? {
            ...product,
            qty: adjustedQty,
            remainingQty: adjustedQty,
            amount:
              product.discount_type === 'percent'
                ? (product.price || 0) * adjustedQty * (1 - (product.discount || 0) / 100)
                : (product.price || 0) * adjustedQty - (product.discount || 0),
          }
          : product
      )
    );
  };

  const handleMessageChange = e => {
    setMessage(e.target.value);
  };

  const handleIsShippedChange = value => {
    setIsShipped(value);
  };

  const handleWarehouseChange = value => {
    setWarehouseId(value);
  };

  const handleReferenceNoChange = e => {
    setReferenceNo(e.target.value);
  };

  const handleShippingPriceChange = value => {
    setShippingPrice(value);
  };

  const columns = [
    {
      title: 'Produk',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <div className="font-bold text-gray-800">{name}</div>
          <div className="text-xs text-gray-500 whitespace-pre-line">{record.description || record.product_description}</div>
        </div>
      ),
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      responsive: ['sm'],
      render: (stock, record) => {
        const isTenor = record.product_description?.toLowerCase().includes('tenor');
        const isSpecialProduct = [1, 2, 3, 4, 5].includes(parseInt(record.id));
        const stockValue = parseInt(stock) || 0;
        console.log(`Product ID: ${record.id}, Name: ${record.name}, Stock: ${stockValue}, IsTenor: ${isTenor}, IsSpecial: ${isSpecialProduct}`);
        return (
          <span>
            {isTenor || isSpecialProduct || stockValue > 0 ? (
              <span style={{ color: 'green', fontSize: '20px' }}>✅</span>
            ) : (
              <span style={{ color: 'red', fontSize: '20px' }}>❌</span>
            )}
          </span>
        );
      },
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      render: (qty, record) => (
        <InputNumber
          min={0}
          max={record.originalQty}
          value={qty}
          onChange={value => handleQuantityChange(record.id, value)}
        />
      ),
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      render: price => `Rp ${Number(price).toLocaleString('id-ID')}`,
    },
    {
      title: 'Diskon',
      key: 'discount',
      render: (_, record) =>
        record.discount > 0 ? `${record.discount}${record.discount_type === 'percent' ? '%' : ' Rp'}` : '-',
    },
    {
      title: 'Jumlah',
      key: 'total',
      render: (_, record) => (
        `Rp ${Math.round(record.amount).toLocaleString('id-ID')}`
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: record => ({
      disabled: record.remainingQty < 0,
    }),
  };

  const handleOk = async () => {
    if (selectedRowKeys.length === 0) {
      notification.error({
        message: 'Error',
        description: 'Silakan pilih setidaknya satu produk.',
      });
      return;
    }

    setLoading(true);

    const selected = products.filter(product => selectedRowKeys.includes(product.key));

    const doPayload = {
      id_data: parseInt(id_data),
      do_data: {
        id_company: orderDetails.id_company || 4,
        company_name: orderDetails.tb_company?.company_name || 'PT Penerbit Erlangga Mahameru - Invoice Kantor',
        nama_customer: orderDetails.nama_customer || 'Eeruvnreionveio neriovneiorni',
        shipping_address: orderDetails.alamat_pengiriman || 'eenviornrenuivennweiocnweiocnwebuiwenieowncoweinio',
        shipping_price: shippingPrice,
        is_shipped: isShipped,
        delivery_date: new Date().toISOString().split('T')[0],
        ship_via: orderDetails.pengiriman || 'Raja Cepat Nusantara',
        tracking_no: `TRK-${Date.now()}`,
        reference_no: referenceNo,
        message: message || '[Tidak Ada Pesan dari Pembeli]',
        warehouse_id: warehouseId,
      },
      do_details: selected.map(product => {
        const isTenor = product.product_description?.toLowerCase().includes('tenor');
        const isDP = product.product_description?.toLowerCase().includes('dp');
        const isSpecialProduct = [1, 2, 3, 4, 5].includes(parseInt(product.id));
        const qty = (isTenor || isDP || isSpecialProduct) ? product.qty : product.qty === 0 ? 1 : product.qty;
        console.log(`DO Product ID: ${product.id}, Qty: ${qty}, IsTenor: ${isTenor}, IsDP: ${isDP}, IsSpecial: ${isSpecialProduct}`);
        return {
          product_id_po: 0,
          product_id: parseInt(product.id),
          quantity: qty.toString(),
          description: product.name || product.description || product.product_description || 'No description provided',
          discount: product.discount || 0,
          taxable: product.taxable || false,
          id_transaksi_direct: product.id_transaksi_direct,
          price: product.price,
          amount: Math.round(product.amount),
        };
      }),
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${baseUrl}/nimda/delivery-order/create-delivery-order-new`,
        doPayload,
        {
          headers: {
            Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const id_delivery_order = response.data.data?.delivery_order?.id_delivery_order;

        if (!id_delivery_order) {
          throw new Error('id_delivery_order not found in API response');
        }

        const savedProducts = selected.map(product => ({
          product_product_id: product.id,
          name: product.name,
          quantity: product.product_description?.toLowerCase().includes('tenor') ? product.qty : product.qty === 0 ? 1 : product.qty,
          price: product.price,
          amount: Math.round(product.amount),
          discount: product.discount || 0,
          discount_type: product.discount_type || 'percent',
          description: product.name || product.description || product.product_description || 'No description provided',
        }));
        localStorage.setItem(`delivery_order_${id_delivery_order}_products`, JSON.stringify(savedProducts));

        const processedProducts = {};

        for (const item of selected) {
          const isTenor = item.product_description?.toLowerCase().includes('tenor');
          const isDP = item.product_description?.toLowerCase().includes('dp');
          const isSpecialProduct = [1, 2, 3, 4, 5].includes(parseInt(item.id));
          const key = `${item.id}-${id_data}`;
          const isFirstInstance = !processedProducts[key];
          processedProducts[key] = true;

          const hasDO = orderDetails.tb_delivery_orders?.some(doItem =>
            doItem.tb_delivery_order_details?.some(
              detail => String(detail.product_id) === String(item.id)
            )
          );

          let inventoryQty = 0;
          if (isSpecialProduct) {
            inventoryQty = 0;
          } else if (isTenor && hasDO) {
            inventoryQty = 0;
          } else if (isTenor || isDP || (!isTenor && !isDP && item.qty > 0)) {
            inventoryQty = Number(item.qty);
          }

          console.log(
            `Inventory Product ID: ${item.id}, Name: ${item.name}, Qty: ${item.qty}, InventoryQty: ${inventoryQty}, Stock: ${item.stock}, IsTenor: ${isTenor}, HasDO: ${hasDO}, IsFirstInstance: ${isFirstInstance}`
          );

          if (isTenor || isDP || isSpecialProduct || (!isTenor && !isDP && item.qty > 0)) {
            const inventoryPayload = {
              product_id: item.id,
              warehouse_id: warehouseId,
              data_id: parseInt(id_data),
              batch_code: `BCH-${dayjs().format('YYYYMMDD')}`,
              movement_type: 'out',
              reference: `ORDER-${id_data}`,
              quantity: inventoryQty,
              unit: 'pcs',
              description: `Stok keluar untuk ORDER-${id_data}`,
              isDP: isDP || false,
            };

            console.log('Inventory Payload:', JSON.stringify(inventoryPayload, null, 2));

            try {
              const inventoryResponse = await fetch(
                `${baseUrl}/nimda/inventory/movements`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `${token}`,
                  },
                  body: JSON.stringify(inventoryPayload),
                  redirect: 'follow',
                }
              );
              const inventoryResult = await inventoryResponse.json();
              if (!inventoryResponse.ok) {
                notification.error({
                  message: 'Gagal Update Stok',
                  description: `Gagal mengurangi stok untuk ${item.name}: ${inventoryResult.message || 'Unknown error'}.`,
                });
              }
            } catch (error) {
              notification.error({
                message: 'Gagal Update Stok',
                description: `Terjadi kesalahan saat mengurangi stok untuk ${item.name}: ${error.message}.`,
              });
            }
          }
        }

        notification.success({
          message: 'Success',
          description: 'Delivery Order created successfully.',
        });

        const updatedRemaining = products.map(product => {
          const selectedProduct = selected.find(s => s.id === product.id);
          if (selectedProduct) {
            const remainingQty = product.originalQty - selectedProduct.qty;
            return { id: product.id, remainingQty: remainingQty > 0 ? remainingQty : 0 };
          }
          return { id: product.id, remainingQty: product.originalQty };
        }).filter(r => r.remainingQty > 0);

        localStorage.setItem(`remainingProducts_${id_data}`, JSON.stringify(updatedRemaining));

        navigate(`/dashboard/delivery-order/detail/${id_delivery_order}`, {
          state: {
            orderDetails,
            selectedProducts: selected.map(item => ({
              ...item,
              amount: Math.round(item.amount),
              discount: item.discount || 0,
              discount_type: item.discount_type || 'percent',
            })),
          },
        });
      } else {
        throw new Error(response.data.message || 'Failed to create Delivery Order');
      }
    } catch (error) {
      console.error('Error creating Delivery Order:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create Delivery Order',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    navigate(`/dashboard/order/detail-order/${id_data}`);
  };

  if (!selectedProducts || !orderDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <Modal
        title={
          <div className="flex items-center text-gray-700">
            <span className="mr-2">🛒</span>
            Create Delivery Order
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        width={1000}
        footer={[
          <button
            key="back"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mr-2"
          >
            Batal
          </button>,
          <button
            key="submit"
            onClick={handleOk}
            disabled={loading}
            className={`px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {loading ? (
              <Spin size="small" className="mr-2" />
            ) : (
              <span className="mr-2">✔</span>
            )}
            Konfirmasi
          </button>,
        ]}
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={products}
          rowKey="key"
          className="shadow-lg rounded-lg"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Text strong>Sudah Dikirim:</Text>
            <Select
              value={isShipped}
              onChange={handleIsShippedChange}
              style={{ width: 200 }}
            >
              <Option value={0}>Belum Dikirim</Option>
              <Option value={1}>Dikirim</Option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Text strong>Gudang:</Text>
            <Select
              value={warehouseId}
              onChange={handleWarehouseChange}
              style={{ width: 200 }}
              placeholder="Pilih Gudang"
              loading={warehouseLoading}
              disabled={warehouseLoading}
            >
              {warehouses.map(warehouse => (
                <Option key={warehouse.id_warehouse} value={warehouse.id_warehouse}>
                  {warehouse.name_warehouse}
                </Option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Text strong>No Referensi:</Text>
            <Input
              value={referenceNo}
              onChange={handleReferenceNoChange}
              placeholder="Masukkan No Referensi"
              style={{ width: 200 }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Text strong>Biaya Pengiriman:</Text>
            <InputNumber
              min={0}
              value={shippingPrice}
              onChange={handleShippingPriceChange}
              placeholder="Masukkan Biaya Pengiriman"
              style={{ width: 200 }}
              formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/Rp\s?|(,*)/g, '')}
            />
          </div>
        </div>
        <div className="mt-4">
          <Text strong>Pesan:</Text>
          <TextArea
            rows={4}
            value={message}
            onChange={handleMessageChange}
            placeholder="Masukkan pesan untuk Delivery Order"
            className="mt-2"
          />
        </div>
        <div className="mt-4 text-gray-600">
          Total Produk Dipilih: {selectedRowKeys.length} | Total Harga: Rp{' '}
          {Math.round(
            products
              .filter(p => selectedRowKeys.includes(p.key))
              .reduce((sum, p) => sum + p.amount, 0)
          ).toLocaleString('id-ID')}
        </div>
      </Modal>
    </div>
  );
};

export default SelectProductsPageElse;
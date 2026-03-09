import React, { useState, useEffect } from 'react';
import { Modal, Table, InputNumber, notification } from 'antd';
import { baseUrl } from '@/configs';

const ProductSelectionModal = ({ visible, onCancel, onOk, products, isDirect, tb_delivery_orders = [] }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAllProducts();
    }
  }, [visible, products, isDirect]);

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/nimda/master_product?limit=50000`,
        {
          method: 'GET',
          redirect: 'follow',
        }
      );
      const result = await response.json();
      if (result.code === 200) {
        const allProducts = result.data;
        console.log('API Products (IDs 1-5):', allProducts.filter(p => [1, 2, 3, 4, 5].includes(parseInt(p.id))));
        const updatedProducts = products.map((p, index) => {
          const apiProduct = allProducts.find(
            ap => ap.id === (isDirect ? p.id : p.id_detail)
          );
          const stock = apiProduct ? apiProduct.stock : 0;
          console.log(`Product ID: ${p.id}, Name: ${p.name}, Stock: ${stock}, Description: ${p.product_description}`);
          const isTenor = p.product_description?.toLowerCase().includes('tenor');
          const displayQty = isTenor ? p.qty : p.qty === 0 ? 1 : p.qty;
          return {
            ...p,
            id_transaksi_direct: p.id_transaksi_direct,
            originalQty: p.qty,
            stock,
            qty: displayQty,
            discount: p.discount || 0,
            discount_type: p.discount_type || 'percent',
            amount:
              p.discount_type === 'percent'
                ? p.price * displayQty * (1 - (p.discount || 0) / 100)
                : p.price * displayQty - (p.discount || 0),
            uniqueKey: `${p.id}-${index}`,
            product_description: p.product_description || 'Tidak ada deskripsi',
          };
        });
        setProductData(updatedProducts);
      } else {
        notification.error({
          message: 'Error',
          description: 'Gagal mengambil data stok produk dari API',
        });
        setProductData(
          products.map((p, index) => {
            const isTenor = p.product_description?.toLowerCase().includes('tenor');
            const displayQty = isTenor ? p.qty : p.qty === 0 ? 1 : p.qty;
            return {
              ...p,
              id_transaksi_direct: p.id_transaksi_direct,
              originalQty: p.qty,
              stock: 0,
              qty: displayQty,
              discount: p.discount || 0,
              discount_type: p.discount_type || 'percent',
              amount:
                p.discount_type === 'percent'
                  ? p.price * displayQty * (1 - (p.discount || 0) / 100)
                  : p.price * displayQty - (p.discount || 0),
              uniqueKey: `${p.id}-${index}`,
              product_description: p.product_description || 'Tidak ada deskripsi',
            };
          })
        );
      }
    } catch (error) {
      console.error('Error processing products:', error);
      notification.error({
        message: 'Error',
        description: 'Gagal memproses data produk',
      });
      setProductData(
        products.map((p, index) => {
          const isTenor = p.product_description?.toLowerCase().includes('tenor');
          const displayQty = isTenor ? p.qty : p.qty === 0 ? 1 : p.qty;
          return {
            ...p,
            originalQty: p.qty,
            stock: 0,
            qty: displayQty,
            discount: p.discount || 0,
            discount_type: p.discount_type || 'percent',
            amount:
              p.discount_type === 'percent'
                ? p.price * displayQty * (1 - (p.discount || 0) / 100)
                : p.price * displayQty - (p.discount || 0),
            uniqueKey: `${p.id}-${index}`,
            product_description: p.product_description || 'Tidak ada deskripsi',
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (value, record) => {
    const isTenor = record.product_description?.toLowerCase().includes('tenor');
    const adjustedValue = isTenor ? value : value <= 0 ? 1 : value > record.originalQty ? record.originalQty : value;
    const updatedProducts = productData.map(p =>
      p.uniqueKey === record.uniqueKey
        ? {
          ...p,
          qty: adjustedValue,
          amount:
            p.discount_type === 'percent'
              ? p.price * adjustedValue * (1 - (p.discount || 0) / 100)
              : p.price * adjustedValue - (p.discount || 0),
        }
        : p
    );
    setProductData(updatedProducts);

    const updatedSelected = selectedProducts.map(sp =>
      sp.uniqueKey === record.uniqueKey
        ? {
          ...sp,
          qty: adjustedValue,
          amount:
            sp.discount_type === 'percent'
              ? sp.price * adjustedValue * (1 - (sp.discount || 0) / 100)
              : sp.price * adjustedValue - (sp.discount || 0),
        }
        : sp
    );
    setSelectedProducts(updatedSelected);
  };

  const breakDescriptionIntoLines = (text, maxLength = 50) => {
    if (!text) return ['Tidak ada deskripsi'];
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length >= maxLength) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const columns = [
    ...(isDirect
      ? []
      : [
        {
          title: 'Image',
          dataIndex: 'image',
          key: 'image',
          responsive: ['md'],
          render: image => (
            <img
              src={image}
              alt="Product"
              className="w-12 h-12 object-cover rounded-lg shadow-md hover:scale-110 transition-transform"
            />
          ),
        },
      ]),
    {
      title: 'Produk',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex flex-col">
          <div className="font-bold text-gray-800 text-sm">{name}</div>
          <div className="text-xs text-gray-500 line-clamp-2">
            {breakDescriptionIntoLines(record.product_description).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
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
        // Check if there's an existing DO for this product_id
        const hasDO = tb_delivery_orders.some(doItem =>
          doItem.tb_delivery_order_details?.some(
            detail => String(detail.product_id) === String(record.id)
          )
        );
        const isTenorWithDO = isTenor && hasDO;
        console.log(
          `Product ID: ${record.id}, Name: ${record.name}, Stock: ${stockValue}, IsTenor: ${isTenor}, IsSpecial: ${isSpecialProduct}, HasDO: ${hasDO}, IsTenorWithDO: ${isTenorWithDO}`
        );
        return (
          <span>
            {isTenorWithDO || isSpecialProduct || stockValue > 0 ? (
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
          onChange={value => handleQtyChange(value, record)}
          className="w-16"
          size="small"
          disabled={record.is_fulfilled === true}
        />
      ),
    },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      render: price => (
        <span className="text-sm">Rp {price.toLocaleString('id-ID')}</span>
      ),
    },
    {
      title: 'Diskon',
      key: 'discount',
      responsive: ['md'],
      render: (_, record) =>
        record.discount > 0 ? `${record.discount}${record.discount_type === 'percent' ? '%' : ' Rp'}` : '-',
    },
    {
      title: 'Jumlah',
      key: 'total',
      render: (_, record) => (
        <span className="text-sm">Rp {Math.round(record.amount).toLocaleString('id-ID')}</span>
      ),
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedProducts(selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: record.is_fulfilled === true,
      name: record.name,
    }),
  };

  return (
    <Modal
      title={
        <div className="flex items-center text-gray-700 text-base">
          <span className="mr-2">🛒</span>
          Pilih Produks
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="90vw"
      className="max-w-[2000px] mx-auto"
      footer={[
        <button
          key="back"
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          Batal
        </button>,
        <button
          key="submit"
          onClick={() => {
            if (selectedProducts.length === 0) {
              notification.error({
                message: 'Tidak Ada Produk Dipilih',
                description: 'Harap pilih produk',
              });
              return;
            }
            const finalProducts = selectedProducts.map(p => ({
              ...p,
              qty: p.product_description?.toLowerCase().includes('tenor') ? p.qty : p.qty === 0 ? 1 : p.qty,
            }));
            onOk(finalProducts);
          }}
          className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm"
        >
          <span className="mr-1">✔</span>
          Konfirmasi
        </button>,
      ]}
    >
      <div className="overflow-x-auto">
        <Table
          loading={loading}
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
          columns={columns}
          dataSource={productData}
          rowKey="uniqueKey"
          className="shadow-lg rounded-lg"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            simple: true,
          }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => record.is_fulfilled === true ? 'bg-gray-100 opacity-60' : ''}
        />
      </div>
      <div className="mt-4 text-gray-600 text-sm">
        Total Produk Dipilih: {selectedProducts.length} | Total Harga: Rp{' '}
        {Math.round(selectedProducts.reduce((total, product) => total + product.amount, 0)).toLocaleString('id-ID')}
      </div>
    </Modal>
  );
};

export default ProductSelectionModal;
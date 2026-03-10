import React, { useState, useEffect } from 'react';
import { Modal, Table, InputNumber, notification, Tag, Tooltip, Badge, Space } from 'antd';
import { baseUrl } from '@/configs';
import { fetchAllProducts as fetchAllProductsUtil } from '@/utils/productUtils';

const ProductSelectionModal = ({ visible, onCancel, onOk, products, isDirect, tb_delivery_orders = [] }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productData, setProductData] = useState([]);
  const [fifoPreview, setFifoPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAllProducts();
      fetchFifoPreview();
    }
  }, [visible, products, isDirect]);

  const fetchFifoPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const payload = {
        details: products.map(p => ({
          id_product: isDirect ? p.id : p.id_detail,
          qty_request: p.qty === 0 ? 1 : p.qty
        }))
      };

      const response = await fetch(`${baseUrl}/nimda/fifo-stock/preview-deduction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setFifoPreview(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching FIFO preview:', error);
    }
  };

  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const allProducts = await fetchAllProductsUtil(token);
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
      title: <span className="text-gray-600 font-semibold">Stok</span>,
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
      responsive: ['sm'],
      render: (stock, record) => {
        const isTenor = record.product_description?.toLowerCase().includes('tenor');
        const isSpecialProduct = [1, 2, 3, 4, 5].includes(parseInt(record.id));
        const stockValue = parseInt(stock) || 0;
        const hasDO = tb_delivery_orders.some(doItem =>
          doItem.tb_delivery_order_details?.some(
            detail => String(detail.product_id) === String(record.id)
          )
        );
        const isSufficient = isTenor && hasDO || isSpecialProduct || stockValue > 0;

        return (
          <Tooltip title={isSufficient ? 'Stok Tersedia' : 'Stok Habis'}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isSufficient ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
              {isSufficient ? '✓' : '✕'}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: <span className="text-gray-600 font-semibold">Vendor</span>,
      key: 'fifo_preview',
      align: 'center',
      responsive: ['md'],
      render: (_, record) => {
        const fifoItem = fifoPreview.find(f => String(f.id_product) === String(record.id));
        if (!fifoItem) return <span className="text-gray-300 italic text-[10px]">No data</span>;

        return (
          <div className={`p-2.5 rounded-xl border w-full max-w-[170px] mx-auto text-left shadow-sm transition-all hover:shadow-md ${fifoItem.is_sufficient ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
            <div className="flex justify-between items-center mb-2.5">
              <Tag color={fifoItem.is_sufficient ? 'green' : 'volcano'} className="m-0 text-[10px] font-bold px-2 rounded-full border-none shadow-sm">
                {fifoItem.is_sufficient ? 'CUKUP' : 'KURANG'}
              </Tag>
              <div className="flex items-center space-x-1 bg-white/60 px-1.5 py-0.5 rounded-md border border-white/80">
                <span className={`text-[11px] font-bold ${fifoItem.is_sufficient ? 'text-green-600' : 'text-red-600'}`}>
                  {fifoItem.qty_fulfilled}
                </span>
                <span className="text-[10px] text-gray-400">/</span>
                <span className="text-[11px] text-gray-500 font-bold">{fifoItem.qty_total_request}</span>
              </div>
            </div>

            <div className="space-y-2">
              {fifoItem.allocations?.map((a, i) => (
                <div key={i} className={`relative pl-3 ${i > 0 ? 'pt-2 border-t border-gray-100/50' : ''}`}>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                  <div className="text-[10px] text-gray-800 font-bold truncate leading-tight" title={a.vendor_name}>
                    {a.vendor_name}
                  </div>
                  <div className="text-[9px] text-blue-600 font-medium flex items-center mt-1">
                    <span className="mr-1">📦</span> {a.source_rn}
                  </div>
                </div>
              ))}

              {!fifoItem.allocations?.length && (
                <div className="py-2 text-center">
                  <span className="text-[10px] text-gray-400 font-medium italic">Tidak ada alokasi</span>
                </div>
              )}
            </div>
          </div>
        );
      }
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
        <div className="flex items-center space-x-3 py-1">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl shadow-inner">
            🛒
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 m-0">Pilih Produk</h3>
            <p className="text-xs text-gray-400 font-normal m-0">Silakan pilih produk dan tentukan jumlahnya</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width="95vw"
      style={{ top: 20 }}
      className="max-w-[1400px]"
      bodyStyle={{ padding: '20px' }}
      footer={[
        <div key="footer" className="flex items-center justify-between w-full px-2 py-2 border-t border-gray-50 mt-4">
          <div className="text-left">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Terkumpul</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-gray-800">{selectedProducts.length}</span>
              <span className="text-xs text-gray-400 italic">Produk</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-semibold shadow-sm flex items-center"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (selectedProducts.length === 0) {
                  notification.error({
                    message: 'Tidak Ada Produk Dipilih',
                    description: 'Harap pilih minimal satu produk',
                  });
                  return;
                }
                const finalProducts = selectedProducts.map(p => ({
                  ...p,
                  qty: p.product_description?.toLowerCase().includes('tenor') ? p.qty : p.qty === 0 ? 1 : p.qty,
                }));
                onOk(finalProducts);
              }}
              className="px-8 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm font-bold shadow-lg shadow-green-200 flex items-center"
            >
              <span className="mr-2 text-base">✓</span>
              Konfirmasi Pesanan
            </button>
          </div>
        </div>
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
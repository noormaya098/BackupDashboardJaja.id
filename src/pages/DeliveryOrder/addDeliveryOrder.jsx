import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Table, ConfigProvider, message, InputNumber, Select } from 'antd';
import { SendOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const AddDeliveryOrder = () => {
  const { id_data } = useParams(); // Changed from id_purchase_order to id_data
  const navigate = useNavigate();
  const [transactionData, setTransactionData] = useState(null); // Changed from purchaseData
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doData, setDoData] = useState({
    code_delivery_order: '',
    shipping_address: '',
    shipping_price: 0,
    is_shipped: 0,
    delivery_date: '',
    ship_via: '',
    tracking_no: '',
    reference_no: '',
    message: '',
  });
  const [details, setDetails] = useState([]);

  // Function to calculate total_product
  const calculateTotalProduct = (rate, quantity, discount, taxable, ppn) => {
    const subtotal = (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
    const discountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const ppnAmount = taxable ? totalAfterDiscount * ((parseFloat(ppn) || 0) / 100) : 0;
    return totalAfterDiscount + ppnAmount;
  };

  // Function to convert number to Indonesian text
  const numberToText = (num) => {
    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const teens = [
      'sepuluh',
      'sebelas',
      'dua belas',
      'tiga belas',
      'empat belas',
      'lima belas',
      'enam belas',
      'tujuh belas',
      'delapan belas',
      'sembilan belas',
    ];
    const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
    const thousands = ['', 'ribu', 'juta', 'miliar', 'triliun'];

    if (num === 0) return 'nol rupiah';

    let words = [];
    let chunkCount = 0;

    while (num > 0) {
      let chunk = num % 1000;
      let chunkWords = [];

      if (chunk > 0) {
        if (chunk >= 100) {
          let hundred = Math.floor(chunk / 100);
          if (hundred === 1) {
            chunkWords.push('seratus');
          } else {
            chunkWords.push(`${units[hundred]} ratus`);
          }
          chunk %= 100;
        }

        if (chunk >= 10 && chunk <= 19) {
          chunkWords.push(teens[chunk - 10]);
        } else if (chunk >= 20) {
          let ten = Math.floor(chunk / 10);
          let unit = chunk % 10;
          if (unit > 0) {
            chunkWords.push(`${tens[ten]} ${units[unit]}`);
          } else {
            chunkWords.push(tens[ten]);
          }
        } else if (chunk > 0) {
          if (chunk === 1 && chunkCount === 1) {
            chunkWords.push('seribu');
          } else {
            chunkWords.push(units[chunk]);
          }
        }

        if (chunkWords.length > 0 && chunkCount > 0) {
          chunkWords.push(thousands[chunkCount]);
        }
      }

      words.unshift(...chunkWords);
      num = Math.floor(num / 1000);
      chunkCount++;
    }

    return words.join(' ').trim() + ' rupiah';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id_data) {
        console.error('id_data tidak diberikan!');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        // Fetch Products
        const productResponse = await fetch(
          `${baseUrl}/nimda/master_product?page=1&limit=1000000&t=${Date.now()}`,
          {
            method: 'GET',
            headers: {
              Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const productResult = await productResponse.json();
        console.log('Product API Response:', productResult);
        if (productResult.code === 200 && Array.isArray(productResult.data)) {
          setProductList(productResult.data);
        } else {
          console.error('Product API Error:', productResult);
          setProductList([]);
        }

        // Fetch Transaction Data
        const transactionResponse = await fetch(
          `${baseUrl}/nimda/transaksi/detail-transaksi/${id_data}}`,
          {
            headers: {
              Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
            },
          }
        );

        if (!transactionResponse.ok) {
          throw new Error(`HTTP error! status: ${transactionResponse.status}`);
        }

        const transactionResult = await transactionResponse.json();
        console.log('Transaction API Response:', transactionResult);
        const data = transactionResult.data;
        setTransactionData(data);

        // Initialize details based on tb_transaksi_directs
        const initialDetails = data.tb_transaksi_directs.map((detail, index) => {
          const productMatch = productResult.code === 200 ? productResult.data.find(p => p.id === detail.product_id) : null;
          const taxable = detail.tax_type !== '0.00';
          const ppn = parseFloat(detail.tax_type) || 0;
          const total_product = parseFloat(detail.amount) || calculateTotalProduct(
            detail.rate,
            detail.quantity,
            detail.discount,
            taxable,
            ppn
          );
          return {
            key: `trans-${detail.product_id}-${index}`,
            product_id_po: detail.id_transaksi_direct || 0,
            product_id: detail.product_id || 0,
            product_name: productMatch ? productMatch.name : detail.product_name || 'Produk tidak ditemukan',
            description: detail.product_description || '',
            quantity: parseFloat(detail.quantity) || 0,
            initial_quantity: parseFloat(detail.quantity) || 0, // Store initial quantity
            rate: parseFloat(detail.rate) || 0,
            discount: parseFloat(detail.discount) || 0,
            taxable,
            ppn,
            total_product,
          };
        });
        console.log('Initial Details:', initialDetails);
        setDetails(initialDetails);

        setDoData({
          code_delivery_order: `DO-${data.order_id || 'XXXXX'}`,
          shipping_address: data.alamat_pengiriman || '',
          shipping_price: parseFloat(data.biaya_ongkir) || 0,
          is_shipped: data.status_transaksi === 'Shipped' ? 1 : 0,
          delivery_date: data.tgl_pengiriman || data.created_date || '',
          ship_via: data.pengiriman || 'Raja Cepat',
          tracking_no: data.code_pengiriman || '',
          reference_no: data.faktur || '',
          message: 'Pengiriman sesuai transaksi',
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error(`Gagal mengambil data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_data]);

  const handleDoDataChange = (field, value) => {
    setDoData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (key, field, value) => {
    const updatedDetails = details.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity') {
          const qty = Math.min(parseFloat(value) || 0, item.initial_quantity);
          const disc = item.discount || 0;
          const rate = item.rate || 0;
          const totalExclVat = qty * rate * (1 - disc / 100);
          updatedItem.quantity = qty;
          updatedItem.total_product = item.taxable ? totalExclVat * (1 + item.ppn / 100) : totalExclVat;
        } else if (field === 'discount') {
          const qty = item.quantity || 0;
          const disc = parseFloat(value) || 0;
          const rate = item.rate || 0;
          const totalExclVat = qty * rate * (1 - disc / 100);
          updatedItem.total_product = item.taxable ? totalExclVat * (1 + item.ppn / 100) : totalExclVat;
        } else if (field === 'product_name' && productList.length > 0) {
          const selectedProduct = productList.find(product => product.name === value);
          if (selectedProduct) {
            updatedItem.rate = parseFloat(selectedProduct.sell_price) || 0;
            updatedItem.product_id = selectedProduct.id || 0;
            updatedItem.product_id_po = 0;
            updatedItem.description = selectedProduct.description || item.description;
            updatedItem.discount = 0;
            updatedItem.taxable = false;
            updatedItem.ppn = 0;
            updatedItem.initial_quantity = 0;
            updatedItem.total_product = (updatedItem.quantity || 0) * updatedItem.rate;
          } else {
            updatedItem.product_id = 0;
            updatedItem.rate = 0;
            updatedItem.description = '';
            updatedItem.discount = 0;
            updatedItem.taxable = false;
            updatedItem.ppn = 0;
            updatedItem.initial_quantity = 0;
            updatedItem.total_product = 0;
          }
        }
        return updatedItem;
      }
      return item;
    });
    setDetails(updatedDetails);
  };

  const handleAddDetail = () => {
    const newDetail = {
      key: Date.now().toString(),
      product_id_po: 0,
      product_id: 0,
      product_name: '',
      description: '',
      quantity: 0,
      initial_quantity: 0,
      rate: 0,
      discount: 0,
      taxable: false,
      ppn: 0,
      total_product: 0,
    };
    setDetails([...details, newDetail]);
  };

  const handleRemoveDetail = key => {
    setDetails(details.filter(item => item.key !== key));
  };

  const formatNumber = (num, isQty = false) => {
    if (isQty) {
      return parseInt(num).toLocaleString('id-ID');
    }
    return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateGrandTotal = () => {
    const total = details.reduce((acc, item) => acc + (parseFloat(item.total_product) || 0), 0);
    return formatNumber(total);
  };

  const calculateGrandTotalRaw = () => {
    return details.reduce((acc, item) => acc + (parseFloat(item.total_product) || 0), 0);
  };

  const handleSubmitDO = async () => {
    const payload = {
      id_data: parseInt(id_data), // Changed from id_purchase_order
      do_data: {
        id_company: transactionData?.id_company || 5,
        company_name: transactionData?.tb_company?.company_name || 'PT. Contoh Jaya',
        nama_customer: transactionData?.nama_customer || 'Budi Santoso',
        shipping_address: doData.shipping_address || transactionData?.alamat_pengiriman || '',
        shipping_price: parseFloat(doData.shipping_price) || 0,
        is_shipped: doData.is_shipped || 0,
        delivery_date: doData.delivery_date || transactionData?.tgl_pengiriman || '',
        ship_via: doData.ship_via || transactionData?.pengiriman || 'Raja Cepat',
        tracking_no: doData.tracking_no || transactionData?.code_pengiriman || '',
        reference_no: doData.reference_no || transactionData?.faktur || '',
        message: doData.message || 'Pengiriman sesuai transaksi',
      },
      do_details: details.map(detail => {
        const productMatch = productList.find(p => p.name === detail.product_name);
        return {
          product_id_po: detail.product_id_po || 0,
          product_id: productMatch ? productMatch.id : detail.product_id || 0,
          quantity: parseFloat(detail.quantity).toString() || '0',
          description: detail.description || '',
          discount: parseFloat(detail.discount) || 0,
          taxable: detail.taxable || false,
          ppn: parseFloat(detail.ppn) || 0,
        };
      }),
    };

    console.log('DO Payload:', JSON.stringify(payload, null, 2));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${baseUrl}/nimda/delivery-order/create-delivery-order`,
        {
          method: 'POST',
          headers: {
            Authorization: token && token.startsWith('Bearer ') ? token : `${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Gagal submit DO: ${response.status} - ${result.message || 'Unknown error'}`);
      }

      const id_delivery_order = result.data?.delivery_order?.id_delivery_order;
      if (!id_delivery_order) {
        throw new Error('ID Delivery Order tidak ditemukan di response');
      }

      message.success('Delivery Order berhasil dibuat!');
      navigate(`/dashboard/delivery-order/detail/${id_delivery_order}`);
    } catch (error) {
      console.error('Error submitting DO:', error);
      message.error(`Gagal submit DO: ${error.message}`);
    }
  };

  const parseNumber = str => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9]/g, '');
    return parseInt(cleaned, 10) || 0;
  };

  const detailColumns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_, __, index) => index + 1,
      align: 'center',
    },
    {
      title: 'Nama Barang',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 300,
      ellipsis: true,
      render: (text, record) => (
        <Select
          value={record.product_name}
          onChange={value => handleDetailChange(record.key, 'product_name', value)}
          placeholder="Pilih produk"
          size="small"
          className="w-full sm:w-[90%]"
          showSearch
          optionFilterProp="children"
          dropdownStyle={{ width: 300 }}
          notFoundContent="Produk tidak ditemukan"
        >
          {productList.map(product => (
            <Option key={product.id} value={product.name}>
              {product.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (text, record) => (
        <InputNumber
          min={0}
          max={record.initial_quantity}
          parser={parseNumber}
          value={record.quantity}
          onChange={value => handleDetailChange(record.key, 'quantity', value)}
          placeholder="0"
          size="small"
          className="w-full sm:w-[95%]"
          formatter={value => formatNumber(value, true)}
        />
      ),
      align: 'right',
    },
    {
      title: 'Satuan',
      key: 'satuan',
      width: 100,
      render: () => 'Unit',
      align: 'center',
    },
    {
      title: 'Harga @',
      dataIndex: 'rate',
      key: 'rate',
      width: 150,
      render: (text, record) => (
        <InputNumber
          min={0}
          value={record.rate}
          disabled
          placeholder="0"
          size="small"
          className="w-full sm:w-[95%]"
          formatter={value => formatNumber(value)}
        />
      ),
      align: 'right',
    },
    {
      title: 'Disc',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      render: (text, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.discount}
          onChange={value => handleDetailChange(record.key, 'discount', value)}
          placeholder="0"
          size="small"
          className="w-full sm:w-[95%]"
          formatter={value => `${value}%`}
        />
      ),
      align: 'center',
    },
    {
      title: 'PPN',
      dataIndex: 'taxable',
      key: 'taxable',
      width: 80,
      render: taxable => (taxable ? 'Yes' : 'No'),
      align: 'center',
    },
    {
      title: 'Total',
      key: 'total',
      width: 150,
      render: (_, record) => (
        <div className="font-bold">{formatNumber(record.total_product)}</div>
      ),
      align: 'right',
    },
    {
      title: 'Action',
      key: 'action',
      width: 70,
      render: (_, record) => (
        <Button
          type="primary"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDetail(record.key)}
          size="small"
        />
      ),
      align: 'center',
    },
  ];

  if (loading) return <div className="p-4">Loading...</div>;
  if (!transactionData) return <div className="p-4">Error: Data tidak ditemukan</div>;

  return (
    <ConfigProvider>
      <div className="px-0 sm:px-0 min-h-screen py-0">
        <div className="w-full bg-white shadow-sm rounded-lg p-4">
          <div className="border-b border-gray-200 pb-2 mb-4">
            <div className="text-lg font-medium text-gray-600">Tambah Delivery Order</div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-bold">Informasi Delivery Order</h2>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mt-2">
              <div className="flex flex-col">
                <label className="font-medium text-sm">Kode DO:</label>
                <Input
                  value={doData.code_delivery_order}
                  onChange={e => handleDoDataChange('code_delivery_order', e.target.value)}
                  className="mt-1 w-full"
                  readOnly
                  style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Biaya Pengiriman:</label>
                <Input
                  type="number"
                  value={doData.shipping_price}
                  onChange={e => handleDoDataChange('shipping_price', parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Tanggal Pengiriman:</label>
                <Input
                  type="date"
                  value={doData.delivery_date}
                  onChange={e => handleDoDataChange('delivery_date', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Metode Pengiriman:</label>
                <Input
                  value={doData.ship_via}
                  onChange={e => handleDoDataChange('ship_via', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Nomor Pelacakan:</label>
                <Input
                  value={doData.tracking_no}
                  onChange={e => handleDoDataChange('tracking_no', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Nomor Referensi:</label>
                <Input
                  value={doData.reference_no}
                  onChange={e => handleDoDataChange('reference_no', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col">
                <label className="font-medium text-sm">Alamat Pengiriman:</label>
                <TextArea
                  rows={3}
                  value={doData.shipping_address}
                  onChange={e => handleDoDataChange('shipping_address', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-medium text-sm">Pesan:</label>
                <TextArea
                  rows={3}
                  value={doData.message}
                  onChange={e => handleDoDataChange('message', e.target.value)}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Detail Barang</h3>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddDetail}
                size="small"
                className="w-full sm:w-auto custom-add-button"
              >
                Tambah Item
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table
                columns={detailColumns}
                dataSource={details}
                pagination={false}
                bordered
                size="small"
                locale={{ emptyText: 'Belum ada item. Klik "Tambah Item" untuk menambahkan.' }}
                className="shadow-sm min-w-[900px]"
              />
            </div>
            <div className="mt-4">
              <div className="text-sm">
                <strong>Terbilang:</strong> {numberToText(Math.floor(calculateGrandTotalRaw()))}
              </div>
              <div className="text-sm mt-4">
                Transaksi dengan ID {transactionData.order_id || 'N/A'}
              </div>
            </div>
            <div className="mt-2 text-right">
              <p className="text-sm font-semibold text-gray-800">
                Grand Total: <span className="text-blue-600">{calculateGrandTotal()}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="default"
              icon={<SendOutlined />}
              onClick={handleSubmitDO}
              className="w-full sm:w-auto"
            >
              Submit DO
            </Button>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AddDeliveryOrder;
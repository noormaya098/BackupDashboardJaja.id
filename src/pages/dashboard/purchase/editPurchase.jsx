import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Select,
  notification
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const EditPurchaseOrder = () => {
  const { id_purchase_order } = useParams();
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({});
  const [vendorList, setVendorList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [pengajuanData, setPengajuanData] = useState(null);
  const navigate = useNavigate();

  // Fetch vendors
  useEffect(() => {
    const fetchAllVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=1000&keyword=`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          }
        );
        const result = await response.json();
        if (result.code === 200) {
          setVendorList(result.data);
        } else {
          notification.error({ message: 'Error', description: 'Gagal mengambil data vendor' });
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        notification.error({ message: 'Error', description: 'Gagal terhubung ke server vendor' });
      }
    };
    fetchAllVendors();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/master_product?limit=50000`,
          {
            method: 'GET',
            headers: { 'Authorization': `${token}` },
          }
        );
        const result = await response.json();
        if (result.code === 200 && Array.isArray(result.data)) {
          setProductList(result.data);
        } else {
          setProductList([]);
        }
      } catch (error) {
        console.error('Error fetching product data:', error);
        setProductList([]);
      }
    };
    fetchProducts();
  }, []);

  // Fetch pengajuan data
  useEffect(() => {
    const fetchPengajuanData = async () => {
      if (!orderDetails.id_pengajuan) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/pengajuan/${orderDetails.id_pengajuan}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP error fetching pengajuan! status: ${response.status}`);
        const pengajuanResult = await response.json();
        setPengajuanData(pengajuanResult.data);
      } catch (error) {
        console.error('Error fetching pengajuan:', error);
        notification.error({ message: 'Error', description: 'Gagal mengambil data pengajuan' });
      }
    };
    fetchPengajuanData();
  }, [orderDetails.id_pengajuan]);

  // Fetch purchase order data
  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      if (!id_purchase_order) {
        console.error('ID Purchase Order tidak diberikan!');
        notification.error({ message: 'Error', description: 'ID Purchase Order tidak ditemukan di URL!' });
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${baseUrl}/nimda/purchase/${id_purchase_order}`,
          {
            method: 'GET',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch purchase order data: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const purchaseData = result.data;
        if (purchaseData) {
          setOrderDetails({
            transaction_no: purchaseData.transaction_no || '',
            transaction_date: purchaseData.transaction_date || null,
            person_name: purchaseData.person_name || '',
            id_supplier: purchaseData.id_supplier || null,
            term_name: purchaseData.term_name || 'Net 30',
            warehouse_name: purchaseData.warehouse_name || '',
            allocation: purchaseData.warehouse_name === 'JAJA ID' ? 'JAJAID' : 'AUTO',
            address: purchaseData.address || '',
            tags: purchaseData.tags || '',
            witholding_value: purchaseData.witholding_value || '0',
            id_pengajuan: purchaseData.id_pengajuan || null,
          });

          const formattedData = purchaseData.purchase_order_details.map((item, index) => {
            const pengajuanItem = pengajuanData?.tb_pengajuan_vendors?.[pengajuanData?.selected]?.tb_pengajuan_pilihans?.find(
              p => p.product_id === item.product_id
            ) || {};
            return {
              key: item.id_purchase_order_detail || Date.now() + index,
              product_id: item.product_id,
              produk: item.product_name || '',
              deskripsi: item.description || '',
              harga: parseFloat(item.rate) || 0,
              qty: parseFloat(item.quantity) || 0,
              disc: parseFloat(item.discount) || 0,
              taxable: pengajuanItem.taxable ?? false,
              ppn: parseFloat(pengajuanItem.ppn ?? 0),
              grandTotal: calculateTotal(
                parseFloat(item.rate) || 0,
                parseFloat(item.quantity) || 0,
                parseFloat(item.discount) || 0,
                pengajuanItem.taxable ?? false,
                parseFloat(pengajuanItem.ppn ?? 0)
              ),
            };
          });

          setTableData(formattedData);
        } else {
          throw new Error('Data purchase order tidak ditemukan dalam respons!');
        }
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        setTableData([]);
        notification.error({ message: 'Error', description: 'Gagal mengambil data purchase order' });
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrderData();
  }, [id_purchase_order, pengajuanData]);

  const calculateTotal = (harga, qty, disc, taxable, ppn) => {
    const subtotal = harga * qty;
    const discountAmount = subtotal * (disc / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const ppnAmount = taxable ? totalAfterDiscount * (ppn / 100) : 0;
    return totalAfterDiscount + ppnAmount;
  };

  const handleProductChange = (value, index) => {
    const selectedProduct = productList.find(product => product.id === value);
    const pengajuanItem = pengajuanData?.tb_pengajuan_vendors?.[pengajuanData.selected]?.tb_pengajuan_pilihans?.find(
      p => p.product_id === value
    ) || {};
    const newData = [...tableData];
    newData[index] = {
      ...newData[index],
      product_id: value,
      produk: selectedProduct ? selectedProduct.name : value,
      harga: selectedProduct ? parseFloat(selectedProduct.price) || 0 : newData[index].harga,
      taxable: pengajuanItem.taxable ?? false,
      ppn: parseFloat(pengajuanItem.ppn ?? 0),
      grandTotal: calculateTotal(
        selectedProduct ? parseFloat(selectedProduct.price) || 0 : newData[index].harga,
        newData[index].qty,
        newData[index].disc,
        pengajuanItem.taxable ?? false,
        parseFloat(pengajuanItem.ppn ?? 0)
      ),
    };
    setTableData(newData);
  };

  const handleFieldChange = (key, field, value) => {
    const newData = tableData.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        if (['harga', 'qty', 'disc'].includes(field)) {
          const harga = parseFloat(updatedItem.harga) || 0;
          const qty = field === 'qty' ? parseFloat(value) || 0 : parseFloat(updatedItem.qty) || 0;
          const disc = parseFloat(updatedItem.disc) || 0;
          const taxable = updatedItem.taxable || false;
          const ppn = parseFloat(updatedItem.ppn) || 0;
          updatedItem.grandTotal = calculateTotal(harga, qty, disc, taxable, ppn);
        }
        return updatedItem;
      }
      return item;
    });
    setTableData([...newData]);
  };

  const handleDelete = (key) => {
    const newData = tableData.filter(item => item.key !== key);
    setTableData([...newData]);
  };

  const handleAddRow = () => {
    const newRow = {
      key: Date.now(),
      product_id: null,
      produk: '',
      deskripsi: '',
      harga: 0,
      qty: 0,
      disc: 0,
      taxable: false,
      ppn: 0,
      grandTotal: 0,
    };
    setTableData([...tableData, newRow]);
  };

  const calculateGrandTotal = () => {
    return tableData.reduce((sum, item) => sum + parseFloat(item.grandTotal || 0), 0);
  };

  const formatNumber = (num) => {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const purchaseOrderDetails = tableData.map(item => ({
        product_id: item.product_id,
        product_name: item.produk,
        description: item.deskripsi,
        quantity: parseFloat(item.qty) || 0,
        rate: parseFloat(item.harga) || 0,
        discount: parseFloat(item.disc) || 0,
        taxable: item.taxable || false,
        ppn: parseFloat(item.ppn) || 0,
        total_product: parseFloat(item.grandTotal) || 0,
      }));

      // Prepare pengajuan details to sync with purchase order
      const pengajuanDetails = tableData.map(item => ({
        product_id: item.product_id,
        quantity: parseFloat(item.qty) || 0,
        price: parseFloat(item.harga) || 0,
        discount: parseFloat(item.disc) || 0,
        taxable: item.taxable || false,
        ppn: parseFloat(item.ppn) || 0,
        total_product: parseFloat(item.grandTotal) || 0,
        total_excl_vat: (parseFloat(item.harga) * parseFloat(item.qty) * (1 - parseFloat(item.disc) / 100)) || 0,
      }));

      const payload = {
        purchaseOrderData: {
          transaction_no: orderDetails.transaction_no,
          transaction_date: orderDetails.transaction_date
            ? moment(orderDetails.transaction_date).format('YYYY-MM-DD')
            : moment().format('YYYY-MM-DD'),
          warehouse_name: orderDetails.warehouse_name,
          person_name: orderDetails.person_name,
          id_supplier: orderDetails.id_supplier,
          address: orderDetails.address,
          tags: orderDetails.tags,
          term_name: orderDetails.term_name,
          witholding_value: String(orderDetails.witholding_value || 0),
          id_pengajuan: orderDetails.id_pengajuan || null,
        },
        purchaseOrderDetails,
        pengajuanDetails, // Add pengajuan details to update tb_pengajuan_pilihans
        grand_total: calculateGrandTotal(),
      };

      console.log('Submitting Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${baseUrl}/nimda/purchase/${id_purchase_order}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log('Submit API Response:', result);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${result.message || 'Unknown error'}`);
      }

      // Fetch updated pengajuan data to verify
      const updatedPengajuanResponse = await fetch(
        `${baseUrl}/nimda/pengajuan/${orderDetails.id_pengajuan}`,
        {
          method: 'GET',
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const updatedPengajuanResult = await updatedPengajuanResponse.json();
      console.log('Updated Pengajuan Data:', updatedPengajuanResult);

      notification.success({ message: 'Sukses', description: 'Purchase Order dan Pengajuan berhasil diperbarui!' });
      navigate(`/dashboard/purchase/order/detail/${id_purchase_order}`);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      notification.error({ message: 'Error', description: 'Gagal menyimpan perubahan: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: <span className="font-bold">Produk</span>,
      dataIndex: 'produk',
      key: 'produk',
      render: (text, record, index) => (
        <Select
          showSearch
          placeholder="Pilih Produk"
          value={record.produk || undefined}
          onChange={(value) => handleProductChange(value, index)}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: 150 }}
          dropdownStyle={{ minWidth: 300 }}
          className="w-full"
        >
          {productList.map((product) => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: <span className="font-bold">Deskripsi</span>,
      dataIndex: 'deskripsi',
      key: 'deskripsi',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.key, 'deskripsi', e.target.value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Harga</span>,
      dataIndex: 'harga',
      key: 'harga',
      render: (text, record) => (
        <InputNumber
          value={text}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={value => value.replace(/\./g, '')}
          onChange={(value) => handleFieldChange(record.key, 'harga', value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Qty</span>,
      dataIndex: 'qty',
      key: 'qty',
      render: (text, record) => (
        <InputNumber
          value={text}
          min={0}
          onChange={(value) => handleFieldChange(record.key, 'qty', value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Disc (%)</span>,
      dataIndex: 'disc',
      key: 'disc',
      render: (text, record) => (
        <InputNumber
          value={text}
          min={0}
          max={100}
          onChange={(value) => handleFieldChange(record.key, 'disc', value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Total</span>,
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (text) => <Input value={formatNumber(parseFloat(text))} disabled className="w-full" />,
    },
    {
      title: <span className="font-bold">Action</span>,
      key: 'action',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
          danger
        />
      ),
    },
  ];

  return (
    <div className="p-2 sm:p-6 bg-white">
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold">Edit Purchase Order</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button type="primary" danger className="bg-pink-600 border-pink-600 w-full sm:w-auto">
            PEMBELIAN TUNAI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Nomor PO:</label>
            <Input
              className="w-full"
              value={orderDetails.transaction_no || 'N/A'}
              onChange={(e) => setOrderDetails({ ...orderDetails, transaction_no: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Supplier:</label>
            <Select
              showSearch
              placeholder="Cari Supplier"
              optionFilterProp="children"
              onChange={(value) => {
                const selectedVendor = vendorList.find(v => v.id_vendor === value);
                setOrderDetails({
                  ...orderDetails,
                  id_supplier: value,
                  person_name: selectedVendor?.display_name || orderDetails.person_name,
                });
              }}
              value={orderDetails.id_supplier || (vendorList.find(v => v.display_name === orderDetails.person_name)?.id_vendor)}
              className="w-full"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {vendorList.map(v => (
                <Option key={v.id_vendor} value={v.id_vendor}>
                  {v.display_name}
                </Option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Tgl Kirim:</label>
            <DatePicker
              className="w-full"
              value={orderDetails.transaction_date ? moment(orderDetails.transaction_date) : null}
              format="YYYY-MM-DD"
              onChange={(date) => setOrderDetails({ ...orderDetails, transaction_date: date })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Tempo:</label>
            <Input
              className="w-full"
              value={orderDetails.term_name || 'N/A'}
              onChange={(e) => setOrderDetails({ ...orderDetails, term_name: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Perusahaan:</label>
            <Select
              className="w-full"
              value={orderDetails.allocation}
              onChange={(value) => setOrderDetails({
                ...orderDetails,
                allocation: value,
                warehouse_name: value === 'JAJAID' ? 'JAJA ID' : 'JAJA AUTO',
              })}
            >
              <Option value="JAJAID">JAJA ID</Option>
              <Option value="AUTO">JAJA AUTO</Option>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Ppn:</label>
            <InputNumber
              className="w-full"
              value={orderDetails.witholding_value ? parseFloat(orderDetails.witholding_value) : 0}
              min={0}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              onChange={(value) => setOrderDetails({ ...orderDetails, witholding_value: value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Gudang:</label>
            <Input
              className="w-full"
              value={orderDetails.warehouse_name || ''}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Alamat:</label>
            <TextArea
              className="w-full"
              rows={2}
              value={orderDetails.address || 'N/A'}
              onChange={(e) => setOrderDetails({ ...orderDetails, address: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Catatan:</label>
            <TextArea
              className="w-full"
              rows={2}
              placeholder="Mohon dikirim segera..."
              value={orderDetails.tags || ''}
              onChange={(e) => setOrderDetails({ ...orderDetails, tags: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Kena Pph:</label>
            <InputNumber
              className="w-full"
              value={orderDetails.witholding_value ? parseFloat(orderDetails.witholding_value) : 0}
              min={0}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              onChange={(value) => setOrderDetails({ ...orderDetails, witholding_value: value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="w-full sm:w-32 font-medium">Jenis Diskon:</label>
            <Input
              className="w-full"
              value={orderDetails.discount_type || 'Persen'}
              disabled
            />
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
          <div className="font-medium">Baris lain-lain:</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              className="w-full sm:w-64"
              value={orderDetails.additional_line || 'Ongkos Pasang'}
              onChange={(e) => setOrderDetails({ ...orderDetails, additional_line: e.target.value })}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRow}
              className="bg-blue-500 border-blue-500 w-full sm:w-auto"
            >
              Tambah Baris
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="middle"
          className="mb-4"
          scroll={{ x: 'max-content' }}
          summary={() => {
            const grandTotal = calculateGrandTotal();
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} className="text-right font-bold">
                  Grand Total
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Input
                    className="w-full"
                    value={formatNumber(grandTotal)}
                    disabled
                  />
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />

        <div className="flex justify-center mt-4 sm:mt-6">
          <Button
            type="primary"
            size="large"
            className="px-4 sm:px-8 bg-green-500 hover:bg-green-600 w-full sm:w-auto"
            onClick={handleSubmit}
            loading={loading}
          >
            SIMPAN PERUBAHAN
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseOrder;
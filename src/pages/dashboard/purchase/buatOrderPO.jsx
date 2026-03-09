import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  Button,
  Table,
  InputNumber,
  Select,
  notification,
  Spin
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const BuatOrderPO = () => {
  const { id_pengajuan } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tableData, setTableData] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    transaction_no: '',
    transaction_date: '',
    person_name: '',
    id_supplier: null,
    id_pengajuan_vendor: null,
    term_name: 'Net 30',
    warehouse_name: '',
    warehouse_id: null,
    warehouse_code: 'jjd01',
    allocation: '',
    address: '',
    tags: '',
    witholding_value: '0',
    witholding_account_name: 'Tax Account',
    witholding_type: 'Percentage',
    email: '',
    is_shipped: false,
    ship_via: 'FedEx',
    shipping_date: '',
    shipping_price: 0,
    shipping_address: '',
    reference_no: '',
    due_date: '',
  });
  const [vendorList, setVendorList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pengajuanData, setPengajuanData] = useState(null);

  const fixedAddress = "Jl. H. Baping No.100, RT.6/RW.9, Ciracas, Kec. Ciracas, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13740";

  // Handle vendor selection from navigation state
  useEffect(() => {
    if (location.state) {
      const { id_pengajuan_vendor, id_supplier, supplier_name } = location.state;
      console.log('Received vendor data from navigation:', { id_pengajuan_vendor, id_supplier, supplier_name });

      // Set the selected vendor immediately
      setOrderDetails(prev => ({
        ...prev,
        id_supplier: id_supplier,
        id_pengajuan_vendor: id_pengajuan_vendor,
        person_name: supplier_name,
      }));
    }
  }, [location.state]);

  // Fetch vendors, products, and pengajuan data
  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      try {
        const token = localStorage.getItem('token');

        // Fetch Vendors
        const vendorResponse = await fetch(
          `${baseUrl}/nimda/vendor/get-vendor?page=1&limit=1000&keyword=`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          }
        );
        const vendorResult = await vendorResponse.json();
        if (vendorResult.code === 200) {
          setVendorList(vendorResult.data);
        } else {
          notification.error({
            message: 'Error',
            description: 'Gagal mengambil data vendor',
          });
        }

        // Fetch Products
        const productResponse = await fetch(
          `${baseUrl}/nimda/master_product?limit=500000`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`,
            },
          }
        );
        const productResult = await productResponse.json();
        if (productResult.code === 200) {
          const transformedProducts = productResult.data.map(product => ({
            product_id: product.id,
            product_name: product.name,
            ...product
          }));
          setProductList(transformedProducts);
        } else {
          notification.error({
            message: 'Error',
            description: 'Gagal mengambil data produk',
          });
        }

        // Fetch Pengajuan Data
        if (id_pengajuan) {
          const pengajuanResponse = await fetch(
            `${baseUrl}/nimda/pengajuan/${id_pengajuan}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!pengajuanResponse.ok) {
            throw new Error('Failed to fetch pengajuan data');
          }

          const pengajuanResult = await pengajuanResponse.json();
          const pengajuanData = pengajuanResult.data;

          // Validate pengajuan data structure
          if (pengajuanData && pengajuanData.tb_pengajuan_vendors && Array.isArray(pengajuanData.tb_pengajuan_vendors)) {
            setPengajuanData(pengajuanData);
          } else {
            console.error('Invalid pengajuan data structure:', pengajuanData);
            notification.error({
              message: 'Error',
              description: 'Data pengajuan tidak valid atau tidak lengkap',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal mengambil data',
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [id_pengajuan]);

  // Fetch warehouses separately
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = localStorage.getItem('token');
        const warehouseResponse = await fetch(`${baseUrl}/nimda/warehouse/get-warehouse`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        });
        const warehouseResult = await warehouseResponse.json();
        if (warehouseResult.code === 200) {
          setWarehouses(warehouseResult.data);
        } else {
          notification.warning({
            message: 'Peringatan',
            description: 'Gagal mengambil data warehouse. Menggunakan default warehouse.',
          });
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        notification.error({
          message: 'Error',
          description: 'Gagal mengambil data warehouse',
        });
      }
    };

    fetchWarehouses();
  }, []);

  // Handle pengajuan and warehouse data to set orderDetails and tableData
  useEffect(() => {
    if (pengajuanData && productList.length > 0) {
      let selectedVendor = null;

      // Priority 1: Use vendor from navigation state if available
      if (location.state && location.state.id_supplier) {
        selectedVendor = pengajuanData.tb_pengajuan_vendors?.find(v => v.id_supplier === location.state.id_supplier);
        console.log('Using vendor from navigation state:', selectedVendor);
      } else {
        // Priority 2: Use selected index from pengajuan data
        const selectedIndex = pengajuanData.selected;
        if (selectedIndex === null || selectedIndex === undefined) {
          selectedVendor = pengajuanData.tb_pengajuan_vendors?.[0];
          console.log('No vendor selected, using first vendor:', selectedVendor);
        } else {
          selectedVendor = pengajuanData.tb_pengajuan_vendors?.[selectedIndex];
        }
      }

      // Check if selectedVendor exists and has required data
      if (!selectedVendor || !selectedVendor.tb_pengajuan_pilihans) {
        console.warn('Selected vendor or pengajuan pilihans not found');
        return;
      }

      const allocation = pengajuanData.allocation;
      const warehouse_id = allocation === 'AUTO' ? 7 : 5;
      const warehouse_name = allocation === 'AUTO' ? 'JAJA AUTO' : 'JAJA ID';
      const warehouse = warehouses.find(w => w.id_warehouse === warehouse_id);

      setOrderDetails({
        transaction_no: '',
        transaction_date: pengajuanData.tgl_pengajuan,
        person_name: selectedVendor?.supplier_name || '',
        id_supplier: selectedVendor?.id_supplier || null,
        id_pengajuan_vendor: selectedVendor?.id_pengajuan_vendor || null,
        term_name: selectedVendor?.payment_terms || 'Net 30',
        warehouse_name: warehouse_name,
        warehouse_id: warehouse_id,
        warehouse_code: warehouse ? warehouse.code_warehouse : 'jjd01',
        allocation: allocation,
        address: fixedAddress,
        tags: pengajuanData.description,
        witholding_value: selectedVendor?.withholding_tax?.replace('%', '') || '0',
        witholding_account_name: 'Tax Account',
        witholding_type: 'Percentage',
        email: 'jeje@example.com',
        is_shipped: false,
        ship_via: 'FedEx',
        shipping_date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
        shipping_price: 50,
        shipping_address: fixedAddress,
        reference_no: pengajuanData.kode_pengajuan,
        due_date: dayjs(pengajuanData.tgl_pengajuan).add(30, 'day').format('YYYY-MM-DD'),
      });

      const biayaLainnyaMapping = {
        78: 1300000, // Product ID 78 (TOSHIBA TV) -> 1,300,000
        7: 34000,    // Product ID 7 (ARCHITECT DIGEST) -> 34,000
        813: 23000,  // Product ID 813 (VOUCHER ALFAMART 50K) -> 23,000
      };

      const formattedData = selectedVendor.tb_pengajuan_pilihans.map(item => {
        // Use product_detail from API response if available, otherwise fallback to productList
        const productName = item.product_detail?.name ||
          productList.find(p => p.product_id === item.product_id)?.product_name ||
          `ID ${item.product_id} tidak ditemukan`;

        const harga = parseFloat(item.price) || 0;
        const qty = parseFloat(item.quantity) || 0;
        const disc = parseFloat(item.discount) || 0;
        const biaya_lainnya = biayaLainnyaMapping[item.product_id] || 0;
        const ppn = item.taxable ? 'VAT' : 'GST';

        return {
          key: Date.now() + Math.random(),
          product_id: item.product_id,
          jenisBarang: productName,
          deskripsi: item.specification || item.product_detail?.description || '',
          harga: harga,
          qty: qty,
          disc: disc,
          biaya_lainnya: biaya_lainnya,
          line_tax_name: ppn,
          grandTotal: calculateTotal(harga, qty, disc, biaya_lainnya, parseFloat(selectedVendor?.withholding_tax?.replace('%', '') || '0')),
        };
      });

      setTableData(formattedData);
    }
  }, [pengajuanData, productList, warehouses, location.state]);

  useEffect(() => {
    if (tableData.length > 0) {
      const updatedTableData = tableData.map(item => ({
        ...item,
        grandTotal: calculateTotal(
          parseFloat(item.harga) || 0,
          parseFloat(item.qty) || 0,
          parseFloat(item.disc) || 0,
          parseFloat(item.biaya_lainnya) || 0,
          parseFloat(orderDetails.witholding_value) || 0
        ),
      }));
      setTableData(updatedTableData);
    }
  }, [orderDetails.witholding_value]);

  const calculateTotal = (harga, qty, disc, biaya_lainnya, ppn) => {
    const subtotal = harga * qty;
    const discountAmount = subtotal * (disc / 100);
    const totalExclVat = subtotal - discountAmount + (parseFloat(biaya_lainnya) || 0);
    const ppnValue = parseFloat(ppn) || 0;
    const vatAmount = ppnValue > 0 ? totalExclVat * (ppnValue / 100) : 0;
    return (totalExclVat + vatAmount).toFixed(2);
  };

  const handleFieldChange = (key, field, value) => {
    const newData = tableData.map(item => {
      if (item.key === key) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'jenisBarang') {
          const selectedProduct = productList.find(product => product.product_id === value);
          updatedItem.product_id = value;
          updatedItem.jenisBarang = selectedProduct ? selectedProduct.product_name : `ID ${value} tidak ditemukan`;
          updatedItem.biaya_lainnya = biayaLainnyaMapping[value] || 0;
          // Get taxable status from current selected vendor
          const currentVendor = pengajuanData?.tb_pengajuan_vendors?.find(v => v.id_supplier === orderDetails.id_supplier);
          updatedItem.line_tax_name = currentVendor?.taxable === 'Yes' ? 'VAT' : 'GST';
        }
        if (['harga', 'qty', 'disc', 'biaya_lainnya'].includes(field)) {
          const harga = parseFloat(updatedItem.harga) || 0;
          const qty = parseFloat(updatedItem.qty) || 0;
          const disc = parseFloat(updatedItem.disc) || 0;
          const biaya_lainnya = parseFloat(updatedItem.biaya_lainnya) || 0;
          const ppn = parseFloat(orderDetails.witholding_value) || 0;
          updatedItem.grandTotal = calculateTotal(harga, qty, disc, biaya_lainnya, ppn);
        }
        return updatedItem;
      }
      return item;
    });
    setTableData(newData);
  };

  const handleDelete = (key) => {
    const newData = tableData.filter(item => item.key !== key);
    setTableData(newData);
  };

  const calculateGrandTotal = () => {
    return tableData.reduce((sum, item) => sum + parseFloat(item.grandTotal || 0), 0);
  };

  const formatNumber = (num) => {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const biayaLainnyaMapping = {
    78: 1300000, // Product ID 78 (TOSHIBA TV) -> 1,300,000
    7: 34000,    // Product ID 7 (ARCHITECT DIGEST) -> 34,000
    813: 23000,  // Product ID 813 (VOUCHER ALFAMART 50K) -> 23,000
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const purchaseOrderDetails = tableData.map(item => ({
        product_id: item.product_id,
        product_name: item.jenisBarang ? item.jenisBarang.substring(0, 255) : '',
        description: item.deskripsi ? item.deskripsi.substring(0, 500) : '',
        quantity: parseFloat(item.qty || 0),
        rate: parseFloat(item.harga || 0),
        discount: parseFloat(item.disc || 0),
        biaya_lainnya: parseFloat(item.biaya_lainnya || 0),
        line_tax_name: item.line_tax_name ? item.line_tax_name.substring(0, 50) : 'VAT',
      }));

      const payload = {
        purchaseOrderData: {
          id_pengajuan: parseInt(id_pengajuan),
          id_pengajuan_vendor: orderDetails.id_pengajuan_vendor,
          transaction_no: orderDetails.transaction_no || '',
          transaction_date: orderDetails.transaction_date
            ? dayjs(orderDetails.transaction_date).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          warehouse_name: 'Gudang Jaja.id',
          warehouse_code: orderDetails.warehouse_code ? orderDetails.warehouse_code.substring(0, 50) : '',
          person_name: orderDetails.person_name ? orderDetails.person_name.substring(0, 100) : '',
          id_supplier: orderDetails.id_supplier,
          address: orderDetails.address ? orderDetails.address.substring(0, 255) : '',
          tags: orderDetails.tags ? orderDetails.tags.substring(0, 255) : '',
          term_name: orderDetails.term_name ? orderDetails.term_name.substring(0, 50) : '',
          witholding_value: String(orderDetails.witholding_value || '0'),
          witholding_account_name: orderDetails.witholding_account_name ? orderDetails.witholding_account_name.substring(0, 100) : '',
          witholding_type: orderDetails.witholding_type ? orderDetails.witholding_type.substring(0, 50) : '',
          email: orderDetails.email ? orderDetails.email.substring(0, 100) : '',
          is_shipped: orderDetails.is_shipped,
          ship_via: orderDetails.ship_via ? orderDetails.ship_via.substring(0, 50) : '',
          shipping_date: orderDetails.shipping_date,
          shipping_price: orderDetails.shipping_price,
          shipping_address: orderDetails.shipping_address ? orderDetails.shipping_address.substring(0, 255) : '',
          // reference_no: orderDetails.reference_no ? orderDetails.reference_no.substring(0, 20) : (pengajuanData?.kode_pengajuan ? pengajuanData.kode_pengajuan.substring(0, 20) : ''), // Limit to 20 characters
          due_date: orderDetails.due_date,
        },
        purchaseOrderDetails: purchaseOrderDetails,
      };

      // Debug log to see what's being sent
      console.log('Payload being sent:', JSON.stringify(payload, null, 2));
      console.log('Reference no length:', payload.purchaseOrderData.reference_no?.length);
      console.log('Reference no value:', payload.purchaseOrderData.reference_no);

      const response = await fetch(`${baseUrl}/nimda/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Purchase API Response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Unknown error');
      }

      const id_purchase_order = result.data?.purchaseOrder?.id_purchase_order;
      const newTransactionNo = result.data?.purchaseOrder?.transaction_no;

      if (!id_purchase_order) {
        throw new Error('ID Purchase Order tidak ditemukan dalam respons API');
      }

      if (newTransactionNo) {
        setOrderDetails(prev => ({ ...prev, transaction_no: newTransactionNo }));
      }

      notification.success({
        message: 'Sukses',
        description: 'Purchase Order berhasil disimpan!',
      });

      navigate(`/dashboard/purchase/order/detail/${id_purchase_order}`);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      const errorMessage = error.message.includes('is_shipped')
        ? 'Gagal menyimpan Purchase Order karena masalah server. Tim backend sedang diinformasikan.'
        : 'Gagal menyimpan perubahan: ' + error.message;
      notification.error({
        message: 'Error',
        description: errorMessage,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: <span className="font-bold">Nama Barang</span>,
      dataIndex: 'jenisBarang',
      key: 'jenisBarang',
      width: 250,
      render: (text, record) => (
        <Select
          showSearch
          placeholder="Pilih Produk"
          optionFilterProp="children"
          onChange={(value) => handleFieldChange(record.key, 'jenisBarang', value)}
          value={record.product_id}
          style={{ width: 250 }}
          filterOption={(input, option) =>
            option.children.toLowerCase().includes(input.toLowerCase())
          }
          allowClear
        >
          {productList.map(product => (
            <Option key={product.product_id} value={product.product_id}>
              {product.product_name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: <span className="font-bold">Harga</span>,
      dataIndex: 'harga',
      key: 'harga',
      width: 120,
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
      title: <span className="font-bold">Biaya Lainnya</span>,
      dataIndex: 'biaya_lainnya',
      key: 'biaya_lainnya',
      width: 120,
      render: (text, record) => (
        <InputNumber
          value={text}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={value => value.replace(/\./g, '')}
          onChange={(value) => handleFieldChange(record.key, 'biaya_lainnya', value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Qty</span>,
      dataIndex: 'qty',
      key: 'qty',
      width: 80,
      render: (text, record) => (
        <InputNumber
          value={text}
          onChange={(value) => handleFieldChange(record.key, 'qty', value)}
          className="w-full"
        />
      ),
    },
    {
      title: <span className="font-bold">Disc (%)</span>,
      dataIndex: 'disc',
      key: 'disc',
      width: 80,
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
      title: <span className="font-bold">Tax</span>,
      dataIndex: 'line_tax_name',
      key: 'line_tax_name',
      width: 80,
      render: (text, record) => (
        <Select
          value={text}
          onChange={(value) => handleFieldChange(record.key, 'line_tax_name', value)}
          className="w-full"
        >
          <Option value="VAT">VAT</Option>
          <Option value="GST">GST</Option>
        </Select>
      ),
    },
    {
      title: <span className="font-bold">Total</span>,
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 120,
      render: (text) => <Input value={formatNumber(parseFloat(text))} disabled className="w-full" />,
    },
    {
      title: <span className="font-bold">Action</span>,
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
          danger
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '30px',
            height: '30px',
            margin: '0 auto',
            padding: 0,
          }}
        />
      ),
    },
  ];

  return (
    <Spin spinning={fetchLoading} tip="Memuat data...">
      <div className="p-2 sm:p-6 bg-white">
        <style jsx>{`
          .compact-table .ant-table-thead > tr > th,
          .compact-table .ant-table-tbody > tr > td {
            padding: 4px !important;
          }
        `}</style>
        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold">Buat Order PO</h1>
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
                value={orderDetails.transaction_no || "Generated by Backend"}
                disabled
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Supplier:</label>
              <Select
                showSearch
                placeholder="Cari Supplier"
                optionFilterProp="children"
                value={orderDetails.id_supplier}
                onChange={(value) => {
                  const pengajuanVendor = pengajuanData?.tb_pengajuan_vendors?.find(v => v.id_supplier === value);
                  setOrderDetails({
                    ...orderDetails,
                    id_supplier: value,
                    id_pengajuan_vendor: pengajuanVendor?.id_pengajuan_vendor || null,
                    person_name: pengajuanVendor?.supplier_name || '',
                    term_name: pengajuanVendor?.payment_terms || 'Net 30',
                    witholding_value: pengajuanVendor?.withholding_tax?.replace('%', '') || '0',
                  });

                  // Update table data when supplier changes
                  if (pengajuanVendor && pengajuanVendor.tb_pengajuan_pilihans) {
                    const biayaLainnyaMapping = {
                      78: 1300000, // Product ID 78 (TOSHIBA TV) -> 1,300,000
                      7: 34000,    // Product ID 7 (ARCHITECT DIGEST) -> 34,000
                      813: 23000,  // Product ID 813 (VOUCHER ALFAMART 50K) -> 23,000
                    };

                    const formattedData = pengajuanVendor.tb_pengajuan_pilihans.map(item => {
                      const productName = item.product_detail?.name ||
                        productList.find(p => p.product_id === item.product_id)?.product_name ||
                        `ID ${item.product_id} tidak ditemukan`;

                      const harga = parseFloat(item.price) || 0;
                      const qty = parseFloat(item.quantity) || 0;
                      const disc = parseFloat(item.discount) || 0;
                      const biaya_lainnya = biayaLainnyaMapping[item.product_id] || 0;
                      const ppn = item.taxable ? 'VAT' : 'GST';

                      return {
                        key: Date.now() + Math.random(),
                        product_id: item.product_id,
                        jenisBarang: productName,
                        deskripsi: item.specification || item.product_detail?.description || '',
                        harga: harga,
                        qty: qty,
                        disc: disc,
                        biaya_lainnya: biaya_lainnya,
                        line_tax_name: ppn,
                        grandTotal: calculateTotal(harga, qty, disc, biaya_lainnya, parseFloat(pengajuanVendor?.withholding_tax?.replace('%', '') || '0')),
                      };
                    });

                    setTableData(formattedData);
                  }
                }}
                className="w-full"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {pengajuanData?.tb_pengajuan_vendors?.map(vendor => (
                  <Option key={vendor.id_supplier} value={vendor.id_supplier}>
                    {vendor.supplier_name}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Tgl Transaksi:</label>
              <DatePicker
                className="w-full"
                value={orderDetails.transaction_date ? dayjs(orderDetails.transaction_date) : null}
                format="YYYY-MM-DD"
                onChange={(date) => setOrderDetails({
                  ...orderDetails,
                  transaction_date: date,
                  due_date: date ? dayjs(date).add(30, 'day').format('YYYY-MM-DD') : '',
                  shipping_date: date ? dayjs(date).add(5, 'day').format('YYYY-MM-DD') : ''
                })}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Tempo:</label>
              <Input
                className="w-full"
                value={orderDetails.term_name || "N/A"}
                onChange={(e) => setOrderDetails({ ...orderDetails, term_name: e.target.value })}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Perusahaan:</label>
              <Select
                className="w-full"
                value={orderDetails.allocation}
                onChange={(value) => {
                  const warehouse_id = value === "AUTO" ? 7 : 5;
                  const warehouse = warehouses.find(w => w.id_warehouse === warehouse_id);
                  setOrderDetails({
                    ...orderDetails,
                    allocation: value,
                    warehouse_name: value === "JAJAID" ? "JAJA ID" : "JAJA AUTO",
                    warehouse_id: warehouse_id,
                    warehouse_code: warehouse ? warehouse.code_warehouse : 'jjd01',
                  });
                }}
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
              <Select
                showSearch
                placeholder="Pilih warehouse"
                optionFilterProp="children"
                onChange={(value) => {
                  const selectedWarehouse = warehouses.find(w => w.id_warehouse === value);
                  setOrderDetails({
                    ...orderDetails,
                    warehouse_id: value,
                    warehouse_name: selectedWarehouse ? `${selectedWarehouse.code_warehouse} ${selectedWarehouse.name_warehouse}` : '',
                    warehouse_code: selectedWarehouse ? selectedWarehouse.code_warehouse : 'jjd01',
                  });
                }}
                value={orderDetails.warehouse_id}
                className="w-full"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {warehouses.map(warehouse => (
                  <Option key={warehouse.id_warehouse} value={warehouse.id_warehouse}>
                    {`${warehouse.code_warehouse} ${warehouse.name_warehouse}`}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Alamat:</label>
              <TextArea
                className="w-full"
                rows={2}
                value={orderDetails.address}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">Catatan:</label>
              <TextArea
                className="w-full"
                rows={2}
                placeholder="Mohon dikirim segera..."
                value={orderDetails.tags || ""}
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
                value={orderDetails.discount_type || "Percent"}
                disabled
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="w-full sm:w-32 font-medium">No Referensi:</label>
              <Input
                className="w-full"
                placeholder="Masukkan nomor referensi (maks 20 karakter)"
                value={orderDetails.reference_no || ""}
                maxLength={20}
                onChange={(e) => setOrderDetails({ ...orderDetails, reference_no: e.target.value })}
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
                value={orderDetails.additional_line || "Ongkos Pasang"}
                onChange={(e) => setOrderDetails({ ...orderDetails, additional_line: e.target.value })}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  const newItem = {
                    key: Date.now() + Math.random(),
                    product_id: null,
                    jenisBarang: '',
                    deskripsi: '',
                    harga: 0,
                    qty: 1,
                    disc: 0,
                    biaya_lainnya: 0,
                    line_tax_name: 'VAT',
                    grandTotal: '0.00',
                  };
                  setTableData([...tableData, newItem]);
                }}
              >
                Tambah Barang
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
            size="middle"
            className="mb-4 compact-table"
            scroll={{ x: 'max-content' }}
            summary={() => {
              const grandTotal = calculateGrandTotal();
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={6} className="text-right font-bold">
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
              loading={submitLoading}
            >
              SIMPAN PERUBAHAN
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default BuatOrderPO;
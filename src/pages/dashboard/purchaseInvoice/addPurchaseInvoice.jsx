import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Table, Card, Typography, Modal, DatePicker, Checkbox, InputNumber, Select, notification } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { baseUrl } from '@/configs';

const { Title } = Typography;

const AddPurchaseInvoice = () => {
  const { id_purchase_order } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [purchaseData, setPurchaseData] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState('');

  // Calculate total_product
  const calculateTotalProduct = (rate, quantity, discount, taxable, ppn) => {
    const subtotal = (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
    const discountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const taxAmount = taxable ? totalAfterDiscount * ((parseFloat(ppn) || 0) / 100) : 0;
    return totalAfterDiscount + taxAmount;
  };

  // Generate invoice number once
  useEffect(() => {
    const today = dayjs().format('YYYYMMDD');
    const prefix = `INV-${today}-`;
    const nextSeq = String(Math.floor(Math.random() * 1000)).padStart(3, '0'); // Replace with backend logic if available
    setInvoiceNo(`${prefix}${nextSeq}`);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        // Fetch products
        const productResponse = await fetch(`${baseUrl}/nimda/master_product?limit=500000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        });

        const productResult = await productResponse.json();
        if (productResult.code === 200) {
          setProducts(productResult.data);
        } else {
          throw new Error(productResult.message || 'Gagal mengambil data produk.');
        }

        // Fetch warehouses
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
          console.error('Warehouse API Error:', warehouseResult);
          notification.warning({
            message: 'Peringatan',
            description: 'Gagal mengambil data warehouse. Menggunakan default warehouse.',
          });
        }

        // Fetch purchase order
        const purchaseResponse = await fetch(
          `${baseUrl}/nimda/purchase/${id_purchase_order}?t=${Date.now()}`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );

        if (!purchaseResponse.ok) {
          throw new Error(`Gagal mengambil data purchase order: ${purchaseResponse.status}`);
        }

        const purchaseResult = await purchaseResponse.json();
        if (purchaseResult.message === 'Purchase Order retrieved successfully!') {
          const purchaseData = purchaseResult.data;
          setPurchaseData(purchaseData);

          // Initialize invoice items from purchase order details
          const initialItems = purchaseData.purchase_order_details.map((detail) => {
            const product = products.find((p) => p.id === detail.product_id) || {
              name: detail.product_name || `ID ${detail.product_id} tidak ditemukan`,
            };
            return {
              product_id: detail.product_id,
              product_name: product.name,
              quantity: parseInt(detail.quantity) || 1,
              rate: parseFloat(detail.rate) || 0,
              discount: parseFloat(detail.discount) || 0,
              taxable: detail.line_tax_name ? true : false,
              ppn: detail.line_tax_name ? 11 : 0,
              total_product: calculateTotalProduct(
                detail.rate,
                detail.quantity,
                detail.discount,
                detail.line_tax_name ? true : false,
                detail.line_tax_name ? 11 : 0
              ),
            };
          });
          setInvoiceItems(initialItems);

          // Pre-populate form fields
          form.setFieldsValue({
            invoice_date: dayjs(),
            supplier_name: purchaseData.person_name || '',
            email: purchaseData.email || '',
            term_name: purchaseData.term_name || 'Net 30',
            shipping_address: purchaseData.shipping_address || purchaseData.address || '',
            address: purchaseData.address || '',
            shipping_date: purchaseData.shipping_date ? dayjs(purchaseData.shipping_date) : dayjs(),
            due_date: purchaseData.due_date ? dayjs(purchaseData.due_date) : dayjs().add(30, 'day'),
            warehouse_name: purchaseData.warehouse_name || '',
            shipping_price: parseFloat(purchaseData.shipping_price) || 0,
            remarks: purchaseData.tags || '',
            deposit: 0,
            discount_unit: 0,
            witholding_account_name: '',
            witholding_value: 0,
            witholding_type: 'VAT',
            discount_type_name: 'Early Payment',
            use_tax_inclusive: false,
            tax_after_discount: 0,
            syarat_pembayaran: 'Custom',
          });
        } else {
          throw new Error(purchaseResult.message || 'Gagal mengambil data purchase order.');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Data',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceNo) {
      fetchData();
    }
  }, [form, id_purchase_order, invoiceNo]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;

    if (['quantity', 'rate', 'discount', 'taxable', 'ppn'].includes(field)) {
      updatedItems[index].total_product = calculateTotalProduct(
        updatedItems[index].rate,
        updatedItems[index].quantity,
        updatedItems[index].discount,
        updatedItems[index].taxable,
        updatedItems[index].ppn
      );
    }

    setInvoiceItems(updatedItems);
  };

  const onFinish = async (values) => {
    Modal.confirm({
      title: 'Konfirmasi',
      content: 'Apakah Anda yakin ingin menyimpan purchase invoice ini?',
      okText: 'Ya',
      cancelText: 'Tidak',
      okButtonProps: {
        style: {
          backgroundColor: '#059669',
          borderColor: '#059669',
          color: '#fff',
          borderRadius: '6px',
          padding: '6px 16px',
          fontSize: '13px',
        },
      },
      cancelButtonProps: {
        style: {
          borderRadius: '6px',
          padding: '6px 16px',
          fontSize: '13px',
        },
      },
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
          }

          const payload = {
            purchaseInvoiceData: {
              tags: values.remarks || '',
              reference_no: values.invoice_no,
              transaction_date: values.invoice_date.format('YYYY-MM-DD'),
              id_vendor: purchaseData.id_vendor || 1,
              person_name: values.supplier_name,
              address: values.shipping_address || values.address,
              email: values.email,
              message: '',
              memo: values.remarks || '',
              term_name: values.term_name || 'Net 30',
              due_date: values.due_date.format('YYYY-MM-DD'),
              deposit: parseFloat(values.deposit) || 0,
              discount_unit: parseFloat(values.discount_unit) || 0,
              witholding_account_name: '',
              witholding_value: 0,
              witholding_type: 'VAT',
              discount_type_name: 'Early Payment',
              use_tax_inclusive: values.use_tax_inclusive ? 1 : 0,
              tax_after_discount: parseFloat(values.tax_after_discount) || 0,
              id_purchase_order: parseInt(id_purchase_order),
              syarat_pembayaran: values.syarat_pembayaran || 'Custom',
              subtotal: invoiceItems.reduce((acc, item) => {
                const subtotal = (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0);
                const discount = subtotal * ((parseFloat(item.discount) || 0) / 100);
                return acc + (subtotal - discount);
              }, 0),
              total_tax: invoiceItems.reduce((acc, item) => {
                const subtotal = (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0);
                const discount = subtotal * ((parseFloat(item.discount) || 0) / 100);
                return acc + (item.taxable ? (subtotal - discount) * ((parseFloat(item.ppn) || 0) / 100) : 0);
              }, 0),
              grandtotal: parseFloat(values.shipping_price || 0) + invoiceItems.reduce((acc, item) => {
                const subtotal = (parseFloat(item.rate) || 0) * (parseFloat(item.quantity) || 0);
                const discount = subtotal * ((parseFloat(item.discount) || 0) / 100);
                const totalAfterDiscount = subtotal - discount;
                const tax = item.taxable ? totalAfterDiscount * ((parseFloat(item.ppn) || 0) / 100) : 0;
                return acc + (totalAfterDiscount + tax);
              }, 0),
            },
            purchaseInvoiceDetails: invoiceItems.map((item) => ({
              product_name: item.product_name,
              quantity: parseInt(item.quantity) || 0,
              rate: parseFloat(item.rate) || 0,
              discount: parseFloat(item.discount) || 0,
              tax: parseFloat(item.ppn) || 0,
            })),
          };

          const response = await fetch(`${baseUrl}/nimda/purchase-invoice/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
            body: JSON.stringify(payload),
          });

          const result = await response.json();
          if (response.ok && result.message === 'Purchase Invoice created successfully!') {
            notification.success({
              message: 'Berhasil',
              description: 'Purchase Invoice berhasil disimpan.',
            });
            // Navigate to detail page using id_purchase_invoice from response
            navigate(`/dashboard/purchaseinvoice/order/detail/${result.data.purchaseInvoice.id_purchase_invoice}`);
          } else {
            throw new Error(result.message || 'Gagal menyimpan purchase invoice.');
          }
        } catch (error) {
          notification.error({
            message: 'Gagal Menyimpan',
            description: error.message,
          });
        }
      },
    });
  };

  const columns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 60, align: 'center', render: (_, __, index) => index + 1 },
    { title: 'Nama Barang', dataIndex: 'product_name', key: 'product_name' },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (value, _, index) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleItemChange(index, 'quantity', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    { title: 'Satuan', dataIndex: 'uom', key: 'uom', width: 100, align: 'center', render: () => 'Unit' },
    {
      title: 'Harga @',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      align: 'right',
      render: (value, _, index) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => handleItemChange(index, 'rate', val)}
          style={{ width: '100%' }}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: 'Disc (%)',
      dataIndex: 'discount',
      key: 'discount',
      width: 100,
      align: 'center',
      render: (value, _, index) => (
        <InputNumber
          min={0}
          max={100}
          value={value}
          onChange={(val) => handleItemChange(index, 'discount', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Pajak (%)',
      dataIndex: 'ppn',
      key: 'ppn',
      width: 100,
      align: 'center',
      render: (value, record, index) => (
        <InputNumber
          min={0}
          value={value}
          disabled={!record.taxable}
          onChange={(val) => handleItemChange(index, 'ppn', val)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Taxable',
      dataIndex: 'taxable',
      key: 'taxable',
      width: 80,
      align: 'center',
      render: (value, _, index) => (
        <Checkbox
          checked={value}
          onChange={(e) => handleItemChange(index, 'taxable', e.target.checked)}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total_product',
      key: 'total_product',
      width: 120,
      align: 'right',
      render: (value) => value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (!purchaseData) {
    return <div style={{ padding: '20px', color: '#dc2626' }}>Error: Data tidak ditemukan</div>;
  }

  const total = invoiceItems.reduce((acc, item) => acc + parseFloat(item.total_product) || 0, 0) || 0;
  const shippingPrice = form.getFieldValue('shipping_price') || 0;
  const grandTotal = total + parseFloat(shippingPrice);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Card
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px',
        }}
        bodyStyle={{
          padding: window.innerWidth <= 768 ? '16px' : '24px'
        }}
      >
        <Title level={3} style={{ marginBottom: '24px', color: '#1e40af' }}>
          Tambah Purchase Invoice
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{}}
          style={{ marginBottom: '24px' }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <Form.Item
                name="invoice_date"
                label="Tanggal Invoice"
                rules={[{ required: true, message: 'Harap pilih tanggal invoice' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Harap masukkan email yang valid' }]}
              >
                <Input placeholder="supplier@example.com" />
              </Form.Item>
              <Form.Item name="term_name" label="T.O.P">
                <Input placeholder="Net 30" />
              </Form.Item>
              <Form.Item name="deposit" label="Deposit">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="discount_unit" label="Diskon (Nominal)">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
              <Form.Item name="supplier_name" label="Kepada Yth.">
                <Input placeholder="Supplier Name" />
              </Form.Item>
              <Form.Item name="shipping_address" label="Alamat Pengiriman">
                <Input placeholder="Jl. Contoh No. 123" />
              </Form.Item>
              <Form.Item name="shipping_date" label="Tanggal Kirim">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="due_date" label="Jatuh Tempo">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="syarat_pembayaran" label="Syarat Pembayaran">
                <Input placeholder="Custom" />
              </Form.Item>
              <Form.Item name="warehouse_name" label="Gudang">
                <Select placeholder="Pilih Gudang" defaultValue="JAJAID">
                  <Select.Option value="JAJAID">JAJAID</Select.Option>
                  <Select.Option value="AUTO">AUTO</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="shipping_price" label="Ongkos Kirim">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </div>
          </div>
          <Form.Item name="remarks" label="Catatan">
            <Input.TextArea rows={4} placeholder="Catatan tambahan" />
          </Form.Item>
          <Form.Item name="use_tax_inclusive" valuePropName="checked" label="Harga Termasuk Pajak">
            <Checkbox />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.use_tax_inclusive !== currentValues.use_tax_inclusive}
          >
            {({ getFieldValue }) =>
              getFieldValue('use_tax_inclusive') ? (
                <Form.Item name="tax_after_discount" label="Pajak Setelah Diskon">
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Title level={4} style={{ marginBottom: '16px', color: '#1e40af' }}>
            Detail Barang
          </Title>
          <div style={{
            overflowX: 'auto',
            marginBottom: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Table
              columns={columns}
              dataSource={invoiceItems}
              pagination={false}
              size="middle"
              scroll={{ x: 1000 }}
              style={{ minWidth: '100%' }}
              rowClassName="hover:bg-gray-50"
            />
          </div>

          <Card
            style={{
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: '20px', textAlign: 'right' }}
          >
            <Table
              columns={[
                { title: 'Item', dataIndex: 'item', key: 'item', width: '60%' },
                { title: 'Nilai', dataIndex: 'nilai', key: 'nilai', align: 'right' },
              ]}
              dataSource={[
                { key: '1', item: 'Total', nilai: `Rp ${total.toLocaleString('id-ID')}` },
                { key: '2', item: 'Ongkos Kirim', nilai: `Rp ${parseFloat(shippingPrice).toLocaleString('id-ID')}` },
                { key: '3', item: 'Grand Total', nilai: `Rp ${grandTotal.toLocaleString('id-ID')}` },
              ]}
              bordered
              pagination={false}
              size="small"
              showHeader={false}
              style={{
                width: '100%',
                maxWidth: '400px',
                marginLeft: 'auto',
                borderRadius: '8px'
              }}
            />
          </Card>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <Button
              type="default"
              icon={<CloseOutlined />}
              onClick={() => navigate(`/dashboard/purchase/order/detail/${id_purchase_order}`)}
            >
              Batal
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              OK
            </Button>
          </div>
        </Form>
      </Card>

      <style jsx>{`
        .ant-table-thead > tr > th {
          background-color: #1e40af !important;
          color: white !important;
          font-weight: 600;
          font-size: 13px;
          padding: 10px !important;
        }
        .ant-table-tbody > tr > td {
          font-size: 13px;
          color: #1f2937;
          padding: 10px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9 !important;
        }
        .ant-btn {
          font-size: 13px;
          border-radius: 6px;
          padding: 6px 16px;
        }
        .ant-card {
          border: none;
        }
        .ant-form-item-label > label {
          font-weight: 500;
          color: #374151;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .ant-card {
            margin: 8px !important;
            padding: 8px !important;
          }
          
          .ant-form-item {
            margin-bottom: 16px !important;
          }
          
          .ant-form-item-label {
            padding-bottom: 4px !important;
          }
          
          .ant-input, .ant-input-number, .ant-select-selector, .ant-picker {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
          
          .ant-table-thead > tr > th {
            font-size: 12px !important;
            padding: 8px 4px !important;
          }
          
          .ant-table-tbody > tr > td {
            font-size: 12px !important;
            padding: 8px 4px !important;
          }
          
          .ant-btn {
            width: 100% !important;
            margin-bottom: 8px !important;
            height: 44px !important;
            font-size: 16px !important;
          }
          
          .ant-typography h3 {
            font-size: 20px !important;
            margin-bottom: 16px !important;
          }
          
          .ant-typography h4 {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }
        }
        
        @media (max-width: 480px) {
          .ant-card {
            margin: 4px !important;
            padding: 4px !important;
          }
          
          .ant-table-thead > tr > th {
            font-size: 11px !important;
            padding: 6px 2px !important;
          }
          
          .ant-table-tbody > tr > td {
            font-size: 11px !important;
            padding: 6px 2px !important;
          }
          
          .ant-input-number {
            width: 100% !important;
          }
          
          .ant-form-item-label > label {
            font-size: 14px !important;
          }
        }
        
        /* Landscape mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          .ant-form-item {
            margin-bottom: 12px !important;
          }
          
          .ant-btn {
            height: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AddPurchaseInvoice;
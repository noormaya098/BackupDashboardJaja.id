import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Table, Card, Typography, Modal, DatePicker, Checkbox, InputNumber, notification } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { Title } = Typography;

const EditPurchaseInvoice = () => {
  const { id_purchase_invoice } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [invoiceData, setInvoiceData] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate total_product
  const calculateTotalProduct = (rate, quantity, discount, taxable, ppn) => {
    const subtotal = (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
    const discountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const totalAfterDiscount = subtotal - discountAmount;
    const ppnAmount = taxable ? totalAfterDiscount * ((parseFloat(ppn) || 0) / 100) : 0;
    return totalAfterDiscount + ppnAmount;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        const allProducts = await fetchAllProducts(token);
        setProducts(allProducts);

        // Fetch warehouses
        const warehouseResponse = await axios.get(`${baseUrl}/nimda/warehouse/get-warehouse`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        });

        if (warehouseResponse.data.code === 200) {
          setWarehouses(warehouseResponse.data.data);
        } else {
          console.error('Warehouse API Error:', warehouseResponse.data);
          notification.warning({
            message: 'Peringatan',
            description: 'Gagal mengambil data warehouse. Menggunakan default warehouse.',
          });
        }

        // Fetch purchase invoice details
        const invoiceResponse = await axios.get(`${baseUrl}/nimda/purchase-invoice/${id_purchase_invoice}`, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (invoiceResponse.data.message === 'Purchase Invoice retrieved successfully!') {
          const apiData = invoiceResponse.data.data;
          setInvoiceData(apiData);

          // Transform API data to match form structure
          const transformedItems = apiData.tb_purchase_invoice_details.map((detail) => ({
            product_id: detail.id_purchase_invoice_detail,
            product_name: detail.product_name || 'N/A',
            quantity: parseFloat(detail.quantity) || 0,
            rate: parseFloat(detail.rate) || 0,
            discount: parseFloat(detail.discount) || 0,
            taxable: detail.tax !== '0.00',
            ppn: parseFloat(detail.tax) || 0,
            total_product: parseFloat(detail.total_price) || 0,
          }));

          setInvoiceItems(transformedItems);

          // Pre-populate form fields
          form.setFieldsValue({
            invoice_no: apiData.transaction_no || '',
            invoice_date: apiData.transaction_date ? dayjs(apiData.transaction_date) : null,
            supplier_name: apiData.person_name || '',
            email: apiData.email || '',
            term_name: apiData.term_name || '',
            shipping_address: apiData.address || '',
            address: apiData.address || '',
            shipping_date: apiData.transaction_date ? dayjs(apiData.transaction_date) : null, // Default to transaction_date
            due_date: apiData.due_date ? dayjs(apiData.due_date) : null,
            warehouse_name: 'Auto', // Default, as API doesn't provide warehouse_name
            shipping_price: parseFloat(apiData.deposit) || 0, // Using deposit as shipping_price
            remarks: apiData.message || '',
          });
        } else {
          throw new Error(invoiceResponse.data.message || 'Gagal mengambil data purchase invoice.');
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

    fetchData();
  }, [form, id_purchase_invoice]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;

    // Recalculate total_product if relevant fields change
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
      content: 'Apakah Anda yakin ingin menyimpan perubahan purchase invoice ini?',
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

          // Map form values to API payload
          const payload = {
            purchaseInvoiceData: {
              id_purchase_invoice: parseInt(id_purchase_invoice),
              tags: values.remarks || '',
              reference_no: values.invoice_no,
              transaction_date: values.invoice_date.format('YYYY-MM-DD'),
              id_vendor: invoiceData.id_vendor || 1,
              person_name: values.supplier_name,
              address: values.shipping_address || values.address,
              email: values.email,
              message: values.remarks || '',
              memo: values.remarks || '',
              term_name: values.term_name || 'Net 30',
              due_date: values.due_date.format('YYYY-MM-DD'),
              deposit: parseFloat(values.shipping_price) || 0, // Map shipping_price to deposit
              discount_unit: parseFloat(values.discount_unit) || 0,
              witholding_account_name: values.witholding_account_name || 'Tax Account A',
              witholding_value: parseFloat(values.witholding_value) || 0,
              witholding_type: values.witholding_type || 'VAT',
              discount_type_name: values.discount_type_name || 'Early Payment',
              use_tax_inclusive: values.use_tax_inclusive ? 1 : 0,
              tax_after_discount: parseFloat(values.tax_after_discount) || 0,
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
              id_purchase_invoice_detail: item.product_id, // Map product_id to id_purchase_invoice_detail
              product_name: item.product_name,
              quantity: parseInt(item.quantity) || 0,
              rate: parseFloat(item.rate) || 0,
              discount: parseFloat(item.discount) || 0,
              tax: parseFloat(item.ppn) || 0,
            })),
          };

          // Send PUT request to the API
          const response = await axios.put(`${baseUrl}/nimda/purchase-invoice/${id_purchase_invoice}`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
          });

          if (response.data.message === 'Purchase Invoice updated successfully!') {
            notification.success({
              message: 'Berhasil',
              description: 'Purchase Invoice berhasil diperbarui.',
            });
            navigate(`/dashboard/purchaseinvoice/order/detail/${id_purchase_invoice}`);
          } else {
            throw new Error(response.data.message || 'Gagal memperbarui purchase invoice.');
          }
        } catch (error) {
          notification.error({
            message: 'Gagal Memperbarui',
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
      title: 'PPN (%)',
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

  if (!invoiceData) {
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
        }}
      >
        <Title level={3} style={{ marginBottom: '24px', color: '#1e40af' }}>
          Edit Purchase Invoice
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{}}
          style={{ marginBottom: '24px' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
            <div>
              <Form.Item
                name="invoice_no"
                label="Nomor Invoice"
                rules={[{ required: true, message: 'Harap masukkan nomor invoice' }]}
              >
                <Input placeholder="INV-20250519-001" />
              </Form.Item>
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
            </div>
            <div>
              <Form.Item name="supplier_name" label="Kepada Yth.">
                <Input placeholder="Supplier Name" />
              </Form.Item>
              <Form.Item name="shipping_address" label="Alamat Pengiriman">
                <Input placeholder="Jl. Contoh No. 123" />
              </Form.Item>
              <Form.Item name="shipping_date" label="Tanggal Kirim">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="due_date" label="Jatuh Tempo">
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="warehouse_name" label="Gudang">
            <Input placeholder="JAJAID" />
          </Form.Item>
          <Form.Item name="shipping_price" label="Ongkos Kirim">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="remarks" label="Catatan">
            <Input.TextArea rows={4} placeholder="Catatan tambahan" />
          </Form.Item>

          <Title level={4} style={{ marginBottom: '16px', color: '#1e40af' }}>
            Detail Barang
          </Title>
          <Table
            columns={columns}
            dataSource={invoiceItems}
            pagination={false}
            size="middle"
            scroll={{ x: 'max-content' }}
            style={{ marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}
            rowClassName="hover:bg-gray-50"
          />

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
              style={{ width: '40%', marginLeft: 'auto', borderRadius: '8px' }}
            />
          </Card>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <Button
              type="default"
              icon={<CloseOutlined />}
              onClick={() => navigate(`/dashboard/purchaseinvoice/order/detail/${id_purchase_invoice}`)}
            >
              Batal
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
            >
              Simpan
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
          borderRadius: 6px;
          padding: 6px 16px;
        }
        .ant-card {
          border: none;
        }
        .ant-form-item-label > label {
          font-weight: 500;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default EditPurchaseInvoice;
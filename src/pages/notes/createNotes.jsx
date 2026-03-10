import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Row,
  Col,
  Table,
  notification,
  DatePicker,
  Spin,
} from 'antd';
import { PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { baseUrl } from '@/configs';
import { fetchAllProducts } from '@/utils/productUtils';

const { TextArea } = Input;
const { Option } = Select;

const CreateReceiveNote = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [purchaseData, setPurchaseData] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [salesName, setSalesName] = useState('');
  const navigate = useNavigate();
  const { id_purchase_order } = useParams();

  // Fetch products, warehouses, purchase order, and latest receive note number
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
          setVendorName(purchaseData.person_name || '');

          // Extract sales name from the nested structure
          const salesName = purchaseData.tb_pengajuan?.transaksi?.sales_name || '';
          setSalesName(salesName);

          // Pre-populate form fields
          form.setFieldsValue({
            id_purchase_order: parseInt(id_purchase_order),
            person_name: salesName,
            email: '',
            address: '',
            shipping_address: purchaseData.address || '',
            warehouse_id: purchaseData.warehouse_id,
            receive_note_date: dayjs(),
            shipping_date: dayjs(),
          });

          // Pre-populate selected products
          const initialProducts = purchaseData.purchase_order_details.map(detail => ({
            product_id: detail.product_id,
            product_name: detail.product_name,
            quantity: parseInt(detail.quantity) || 1,
            uom: 'Unit',
            batch_code: '',
            expired_date: null,
            remarks: '',
          }));
          setSelectedProducts(initialProducts);
        } else {
          throw new Error(purchaseResult.message || 'Gagal mengambil data purchase order.');
        }

        // Fetch latest receive notes to determine next receive_note_no
        const notesResponse = await fetch(`${baseUrl}/nimda/receive-notes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        });

        const notesResult = await notesResponse.json();
        if (notesResult.success) {
          const today = dayjs().format('YYYYMMDD');
          const prefix = `RN-${today}-`;
          const todayNotes = notesResult.data
            .filter(note => note.receive_note_no.startsWith(prefix))
            .map(note => {
              const seq = parseInt(note.receive_note_no.replace(prefix, '')) || 0;
              return seq;
            });

          const maxSeq = todayNotes.length > 0 ? Math.max(...todayNotes) : 0;
          const nextSeq = maxSeq + 1;
          const nextReceiveNoteNo = `${prefix}${nextSeq.toString().padStart(3, '0')}`;
          form.setFieldsValue({ receive_note_no: nextReceiveNoteNo });
        } else {
          throw new Error(notesResult.message || 'Gagal mengambil data receive notes.');
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
  }, [form, id_purchase_order]);

  // Update receive_note_no when receive_note_date changes
  const handleDateChange = (date) => {
    if (date) {
      const dateStr = date.format('YYYYMMDD');
      const fetchNotes = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
          }

          const response = await fetch(`${baseUrl}/nimda/receive-notes`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${token}`,
            },
          });

          const result = await response.json();
          if (result.success) {
            const prefix = `RN-${dateStr}-`;
            const dateNotes = result.data
              .filter(note => note.receive_note_no.startsWith(prefix))
              .map(note => {
                const seq = parseInt(note.receive_note_no.replace(prefix, '')) || 0;
                return seq;
              });

            const maxSeq = dateNotes.length > 0 ? Math.max(...dateNotes) : 0;
            const nextSeq = maxSeq + 1;
            const nextReceiveNoteNo = `${prefix}${nextSeq.toString().padStart(3, '0')}`;
            form.setFieldsValue({ receive_note_no: nextReceiveNoteNo });
          } else {
            throw new Error(result.message || 'Gagal mengambil data receive notes.');
          }
        } catch (error) {
          notification.error({
            message: 'Gagal Memuat Nomor Invoice',
            description: error.message,
          });
        } finally {
          setLoading(false);
        }
      };

      fetchNotes();
    }
  };

  // Handle product selection
  const handleAddProduct = () => {
    setSelectedProducts([...selectedProducts, {
      product_id: null,
      product_name: '',
      quantity: 1,
      uom: 'Unit',
      batch_code: '',
      expired_date: null,
      remarks: '',
    }]);
  };

  // Handle product change
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...selectedProducts];
    updatedProducts[index][field] = value;
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      updatedProducts[index].product_name = product ? product.name : '';
      updatedProducts[index].uom = product ? product.unit : 'Unit';
    }
    setSelectedProducts(updatedProducts);
  };

  // Product columns
  const productColumns = [
    {
      title: 'Produk',
      dataIndex: 'product_id',
      render: (value, record, index) => (
        <Select
          showSearch
          placeholder="Pilih produk"
          optionFilterProp="children"
          value={value}
          onChange={(val) => handleProductChange(index, 'product_id', val)}
          style={{
            width: '100%',
            backgroundColor: '#f5f5f5',
            color: '#000000',
          }}
          disabled={true}
          filterOption={(input, option) =>
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {products.map(product => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Jumlah',
      dataIndex: 'quantity',
      width: 100,
      render: (value, record, index) => (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
          min={1}
        />
      ),
    },
    {
      title: 'Satuan',
      dataIndex: 'uom',
      render: (value) => value,
    },
    {
      title: 'Kode Batch',
      dataIndex: 'batch_code',
      width: 180,
      render: (value, record, index) => (
        <Input
          value={value}
          onChange={(e) => handleProductChange(index, 'batch_code', e.target.value)}
        />
      ),
    },
    {
      title: 'Tanggal Kadaluarsa',
      dataIndex: 'expired_date',
      render: (value, record, index) => (
        <DatePicker
          format="DD/MM/YYYY"
          value={value ? dayjs(value) : null}
          onChange={(date) => handleProductChange(index, 'expired_date', date ? date.format('YYYY-MM-DD') : null)}
        />
      ),
    },
    {
      title: 'Catatan',
      dataIndex: 'remarks',
      width: 360,
      render: (value, record, index) => (
        <Input
          value={value}
          onChange={(e) => handleProductChange(index, 'remarks', e.target.value)}
        />
      ),
    },
  ];

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
      }

      // Create receive note
      const payload = {
        receive_note_no: values.receive_note_no,
        receive_note_date: values.receive_note_date ? values.receive_note_date.format('YYYY-MM-DD') : null,
        id_purchase_order: parseInt(values.id_purchase_order),
        warehouse_id: parseInt(values.warehouse_id) || 5,
        person_name: salesName || '',
        email: values.email || '',
        address: values.address || '',
        vendor_name: vendorName || '',
        shipping_date: values.shipping_date ? values.shipping_date.format('YYYY-MM-DD') : null,
        ship_via: values.ship_via || '',
        shipping_price: parseFloat(values.shipping_price) || 0,
        shipping_address: values.shipping_address || '',
        tracking_no: values.tracking_no || '',
        remarks: values.remarks || '',
        details: selectedProducts.map(product => ({
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity,
          uom: product.uom,
          batch_code: product.batch_code,
          expired_date: product.expired_date,
          remarks: product.remarks,
        })),
      };

      const response = await fetch(`${baseUrl}/nimda/receive-notes/create-receive-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal membuat receive note.');
      }

      const id_receive_note = result.data?.receive_note?.id_receive_note;
      if (!id_receive_note) {
        throw new Error('ID receive note tidak ditemukan dalam respons API.');
      }

      // Add FIFO Stock Batch
      try {
        const fifoPayload = {
          id_receive_note: id_receive_note,
          id_vendor: result.data?.receive_note?.id_vendor || 0,
          details: selectedProducts.map(product => ({
            id_product: product.product_id,
            qty_receive: product.quantity,
          })),
        };

        const fifoResponse = await fetch(`${baseUrl}/nimda/fifo-stock/add-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
          body: JSON.stringify(fifoPayload),
        });

        const fifoResult = await fifoResponse.json();
        if (!fifoResponse.ok) {
          console.error('Gagal menambahkan batch FIFO:', fifoResult);
          notification.warning({
            message: 'Peringatan FIFO',
            description: `Gagal menambahkan batch FIFO: ${fifoResult.message}`,
          });
        } else {
          console.log('Batch FIFO berhasil ditambahkan:', fifoResult);
          notification.success({
            message: 'FIFO Stock Berhasil',
            description: fifoResult.message || 'Stok batch berhasil dicatat.',
          });
        }
      } catch (fifoError) {
        console.error('Error calling FIFO add-batch:', fifoError);
      }

      // Success notification and navigation
      notification.success({
        message: 'Receive Note Berhasil Dibuat',
        description: `Receive Note ${result.data?.receive_note?.receive_note_no} telah berhasil dibuat.`,
      });
      form.resetFields();
      setSelectedProducts([]);
      navigate(`/dashboard/notes/detail-order/${id_receive_note}`);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      notification.error({
        message: 'Gagal Membuat Receive Note',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading animation while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" tip="Memuat data..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Card title="BUAT RECEIVE NOTE BARU" className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          initialValues={{
            receive_note_date: dayjs(),
            shipping_date: dayjs(),
          }}
        >
          {/* DETAIL RECEIVE NOTE */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">DETAIL RECEIVE NOTE</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              {/* Hidden Purchase Order ID field - still included in payload */}
              <Form.Item
                name="id_purchase_order"
                rules={[{ required: true, message: 'Mohon masukkan ID purchase order' }]}
                style={{ display: 'none' }}
              >
                <Input type="number" />
              </Form.Item>
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Warehouse *"
                  name="warehouse_id"
                  rules={[{ required: true, message: 'Mohon pilih warehouse' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih warehouse"
                    optionFilterProp="children"
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
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Tanggal Pengiriman *"
                  name="shipping_date"
                  rules={[{ required: true, message: 'Mohon pilih tanggal pengiriman' }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Pilih tanggal pengiriman"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Tanggal Penerimaan *"
                  name="receive_note_date"
                  rules={[{ required: true, message: 'Mohon pilih tanggal penerimaan' }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="Pilih tanggal penerimaan"
                    className="w-full"
                    onChange={handleDateChange}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Metode Pengiriman"
                  name="ship_via"
                >
                  <Input
                    placeholder="Masukkan metode pengiriman (contoh: JNE)"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Harga Pengiriman"
                  name="shipping_price"
                >
                  <Input
                    type="number"
                    placeholder="Masukkan harga pengiriman"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={20}>
                <Form.Item
                  label="Catatan"
                  name="remarks"
                >
                  <TextArea
                    placeholder="Masukkan catatan"
                    rows={1}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* DETAIL PENERIMA */}
          <div>
            <h3 className="text-lg font-semibold">DETAIL PENERIMA</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={4}>
                <Form.Item
                  label="Nama Penerima *"
                  name="person_name"
                  rules={[{ required: true, message: 'Masukkan nama penerima' }]}
                >
                  <Input
                    value={salesName}
                    readOnly
                    style={{
                      backgroundColor: '#f5f5f5',
                      color: '#000000',
                      borderColor: '#d9d9d9',
                    }}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ type: 'email', message: 'Format email tidak valid' }]}
                >
                  <Input
                    placeholder="Masukkan email"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Alamat *"
                  name="shipping_address"
                  rules={[{ required: true, message: 'Masukkan alamat' }]}
                >
                  <TextArea
                    placeholder="Masukkan alamat"
                    rows={1}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* DETAIL PENGIRIMAN */}
            <div className="mt-4">
              <h3 className="text-lg font-semibold">DETAIL PENGIRIMAN</h3>
              <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                <Col xs={24} sm={6}>
                  <Form.Item label="Pengirim (Vendor)">
                    <Input
                      value={vendorName}
                      readOnly
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                        borderColor: '#d9d9d9',
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item
                    label="Nomor Resi"
                    name="tracking_no"
                  >
                    <Input
                      placeholder="Masukkan nomor resi"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className="flex justify-start sm:justify-end mt-4">
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
              onClick={() => form.submit()}
              loading={loading}
              disabled={loading}
              icon={<SaveOutlined />}
            >
              Simpan Receive Note
            </Button>
          </div>
        </Form>
      </Card>

      <Card title="DETAIL PRODUK" className="mb-8">
        <Table
          dataSource={selectedProducts}
          columns={productColumns}
          pagination={false}
          bordered={false}
          rowClassName={() => 'border-b'}
          className="mb-2"
          scroll={{ x: 'max-content' }}
          rowKey={(record, index) => index}
        />
        {/* <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddProduct}
          className="w-full"
        >
          Tambah Baris
        </Button> */}
      </Card>
    </div>
  );
};

export default CreateReceiveNote;
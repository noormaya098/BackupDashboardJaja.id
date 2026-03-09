import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  Space,
  notification,
  DatePicker,
  Table,
  Row,
  Col,
  Spin,
} from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const EditReceiveNote = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const navigate = useNavigate();
  const { id_notes } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      if (!id_notes) {
        notification.error({
          message: 'Invalid Receive Note ID',
          description: 'No valid ID provided in the URL.',
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
        }

        console.log(`Fetching receive note with ID: ${id_notes}`);

        const noteResponse = await fetch(`${baseUrl}/nimda/receive-notes/${id_notes}/detail`, {
          method: 'GET',
          headers: {
            Authorization: `${token}`,
            'Content-Type': 'application/json',
          },
        });

        const noteResult = await noteResponse.json();
        if (!noteResponse.ok || !noteResult.success) {
          throw new Error(noteResult.message || 'Gagal memuat data receive note.');
        }

        const noteData = noteResult.data;
        form.setFieldsValue({
          receive_note_no: noteData.receive_note_no,
          id_purchase_order: noteData.id_purchase_order,
          warehouse_id: noteData.warehouse_id,
          person_name: noteData.person_name,
          email: noteData.email,
          address: noteData.address,
          shipping_date: noteData.shipping_date ? dayjs(noteData.shipping_date) : null,
          ship_via: noteData.ship_via,
          shipping_price: noteData.shipping_price,
          shipping_address: noteData.shipping_address,
          tracking_no: noteData.tracking_no,
          remarks: noteData.remarks,
          receive_note_date: noteData.receive_note_date ? dayjs(noteData.receive_note_date) : null,
        });

        setSelectedProducts(noteData.details || []);

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
      } catch (error) {
        console.error('Error fetching data:', error);
        notification.error({
          message: 'Gagal Memuat Data',
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_notes, form]);

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
            color: '#000000'
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
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
      }

      const payload = {
        receive_note_no: values.receive_note_no,
        receive_note_date: values.receive_note_date ? values.receive_note_date.format('YYYY-MM-DD') : null,
        id_purchase_order: values.id_purchase_order,
        warehouse_id: values.warehouse_id || 3,
        person_name: values.person_name || '',
        email: values.email || '',
        address: values.address || '',
        shipping_date: values.shipping_date ? values.shipping_date.format('YYYY-MM-DD') : null,
        ship_via: values.ship_via || '',
        shipping_price: values.shipping_price || 0,
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

      const response = await fetch(`${baseUrl}/nimda/receive-notes/${id_notes}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        notification.success({
          message: 'Receive Note Berhasil Diperbarui',
          description: `Receive Note ${values.receive_note_no} telah berhasil diperbarui.`,
        });
        // Navigasi ke halaman detail menggunakan id_receive_note dari response
        const idReceiveNote = result.data.receive_note.id_receive_note;
        navigate(`/dashboard/notes/detail-order/${idReceiveNote}`);
      } else {
        throw new Error(result.message || 'Gagal memperbarui receive note.');
      }
    } catch (error) {
      notification.error({
        message: 'Gagal Memperbarui Receive Note',
        description: error.message,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Spin spinning={loading} tip="Memuat data..." size="large">
        <Card title="EDIT RECEIVE NOTE" className="mb-8">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
          >
            {/* DETAIL RECEIVE NOTE */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold">DETAIL RECEIVE NOTE</h3>
              <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
                <Col xs={24} sm={4}>
                  <Form.Item
                    label="Nomor Invoice"
                    name="receive_note_no"
                    rules={[{ required: true, message: 'Nomor invoice diperlukan' }]}
                  >
                    <Input
                      readOnly
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                        borderColor: '#d9d9d9'
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item
                    label="Purchase Order ID"
                    name="id_purchase_order"
                    rules={[{ required: true, message: 'Mohon masukkan ID purchase order' }]}
                  >
                    <Input
                      type="number"
                      readOnly
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                        borderColor: '#d9d9d9'
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item
                    label="Warehouse ID"
                    name="warehouse_id"
                    rules={[{ required: true, message: 'Mohon masukkan ID warehouse' }]}
                  >
                    <Input
                      type="number"
                      readOnly
                      style={{
                        backgroundColor: '#f5f5f5',
                        color: '#000000',
                        borderColor: '#d9d9d9'
                      }}
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item
                    label="Tanggal Penerimaan"
                    name="receive_note_date"
                    rules={[{ required: true, message: 'Mohon pilih tanggal penerimaan' }]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      placeholder="Pilih tanggal penerimaan"
                      className="w-full"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={4}>
                  <Form.Item
                    label="Tanggal Pengiriman"
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
                    label="Nama Penerima"
                    name="person_name"
                    rules={[{ required: true, message: 'Masukkan nama penerima' }]}
                  >
                    <Input
                      placeholder="Masukkan nama penerima"
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
                    label="Alamat"
                    name="address"
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
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Alamat Pengiriman"
                      name="shipping_address"
                      rules={[{ required: true, message: 'Masukkan alamat pengiriman' }]}
                    >
                      <TextArea
                        placeholder="Masukkan alamat pengiriman"
                        rows={1}
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
                loading={submitLoading}
                disabled={submitLoading || loading}
                icon={<SaveOutlined />}
              >
                Simpan Perubahan
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
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddProduct}
            className="w-full"
            disabled={loading}
          >
            Tambah Baris
          </Button>
        </Card>
      </Spin>
    </div>
  );
};

export default EditReceiveNote;
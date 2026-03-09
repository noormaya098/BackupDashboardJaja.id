import React from 'react';
import { Form, Input, Button, Card, Select, Row, Col, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { UserAddOutlined } from '@ant-design/icons';

const { Option } = Select;

const AddVendor = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...values,
        id_jurnal_vendor: 0,
        fax: values.fax || null,
        default_ar_account_name: values.default_ar_account_name || null,
        default_ap_account_name: values.default_ap_account_name || null,
        tax_no: values.tax_no || null,
      };

      await axios.post('https://apidev.jaja.id/nimda/vendor/create', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Vendor baru telah ditambahkan ke sistem',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Kembali ke Daftar'
      }).then(() => {
        navigate('/dashboard/vendor');
      });
    } catch (error) {
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menambahkan vendor',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Card title="TAMBAH VENDOR BARU" className="mb-8">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* INFORMASI DASAR */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI DASAR</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nama Tampilan"
                  name="display_name"
                  rules={[{ required: true, message: 'Masukkan nama tampilan!' }]}
                >
                  <Input placeholder="Masukkan Nama Tampilan" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nama Perusahaan"
                  name="company_name"
                >
                  <Input placeholder="Masukkan Nama Perusahaan" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Gelar"
                  name="title"
                  // Removed required rule to make it optional
                >
                  <Select placeholder="Pilih Gelar" className="w-full">
                    <Option value="Mr">Mr</Option>
                    <Option value="Mrs">Mrs</Option>
                    <Option value="Ms">Ms</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nama Depan"
                  name="first_name"
                >
                  <Input placeholder="Masukkan Nama Depan" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nama Tengah"
                  name="middle_name"
                >
                  <Input placeholder="Masukkan Nama Tengah" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nama Belakang"
                  name="last_name"
                >
                  <Input placeholder="Masukkan Nama Belakang" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ type: 'email', message: 'Email tidak valid!' }]}
                >
                  <Input placeholder="Masukkan Email" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* KONTAK & ALAMAT */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">KONTAK & ALAMAT</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Telepon"
                  name="phone"
                  rules={[{ message: 'Masukkan nomor telepon!' }]} // Made required
                >
                  <Input placeholder="Masukkan Nomor Telepon" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nomor Seluler"
                  name="mobile"
                >
                  <Input placeholder="Masukkan Nomor Seluler" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Fax"
                  name="fax"
                >
                  <Input placeholder="Masukkan Nomor Fax" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Alamat Penagihan"
                  name="billing_address"
                >
                  <Input.TextArea
                    placeholder="Masukkan Alamat Penagihan"
                    rows={3}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Alamat"
                  name="address"
                  rules={[{ message: 'Masukkan alamat vendor!' }]} // Made required
                >
                  <Input.TextArea
                    placeholder="Masukkan Alamat Vendor"
                    rows={3}
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* INFORMASI KEUANGAN */}
          <div>
            <h3 className="text-lg font-semibold">INFORMASI KEUANGAN</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nama Akun AR Default"
                  name="default_ar_account_name"
                >
                  <Input placeholder="Masukkan Nama Akun AR" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nama Akun AP Default"
                  name="default_ap_account_name"
                >
                  <Input placeholder="Masukkan Nama Akun AP" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Nomor Pajak"
                  name="tax_no"
                >
                  <Input placeholder="Masukkan Nomor Pajak" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Card>

      <div className="flex justify-start sm:justify-end mt-8">
        <Button
          type="primary"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
          onClick={() => form.submit()}
          loading={loading}
          disabled={loading}
        >
          Simpan Vendor
        </Button>
      </div>
    </div>
  );
};

export default AddVendor;
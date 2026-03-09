import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, Row, Col, Spin, Result } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { LoadingOutlined } from '@ant-design/icons';

const { Option } = Select;

const EditVendor = () => {
  const [form] = Form.useForm();
  const { id_vendor } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(false);
  const [vendorName, setVendorName] = useState('');

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://apidev.jaja.id/nimda/vendor/get-vendor-detail?id_vendor=${id_vendor}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const vendorData = response.data.data;
        setVendorName(vendorData.display_name);
        
        form.setFieldsValue({
          display_name: vendorData.display_name,
          company_name: vendorData.company_name,
          title: vendorData.pic_vendor.title,
          first_name: vendorData.pic_vendor.first_name,
          middle_name: vendorData.pic_vendor.middle_name,
          last_name: vendorData.pic_vendor.last_name,
          billing_address: vendorData.billing_address,
          address: vendorData.address,
          phone: vendorData.phone,
          fax: vendorData.fax,
          mobile: vendorData.mobile,
          email: vendorData.email,
          default_ar_account_name: vendorData.default_ar_account_name,
          default_ap_account_name: vendorData.default_ap_account_name,
          tax_no: vendorData.tax_no,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vendor:", error);
        Swal.fire({
          title: 'Error!',
          text: 'Gagal mengambil data vendor',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
        setError(true);
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id_vendor, form]);

  const onFinish = async (values) => {
    setSubmitLoading(true);
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

      await axios.put(`https://apidev.jaja.id/nimda/vendor/update/${id_vendor}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        title: 'Berhasil!',
        text: 'Informasi vendor berhasil diperbarui',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Kembali ke Daftar'
      }).then(() => {
        navigate('/dashboard/vendor');
      });
    } catch (error) {
      console.error("Error updating vendor:", error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat memperbarui vendor',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
          <p className="mt-4 text-gray-600">Memuat data vendor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <Result
          status="error"
          title="Gagal memuat data"
          subTitle="Terjadi kesalahan saat mengambil informasi vendor. Silakan coba lagi."
          extra={[
            <Button 
              type="primary" 
              key="back" 
              onClick={() => navigate('/dashboard/vendor')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Kembali ke Daftar Vendor
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Card title={`EDIT VENDOR - ${vendorName || 'Vendor'}`} className="mb-8">
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
                  rules={[{ required: true, message: 'Pilih gelar!' }]}
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
          loading={submitLoading}
          disabled={submitLoading}
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
};

export default EditVendor;
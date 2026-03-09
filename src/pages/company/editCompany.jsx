import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Radio, Row, Col } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const EditCompany = () => {
  const [form] = Form.useForm();
  const { id_company } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/company/get-company-detail?id_company=${id_company}`, {
          headers: { Authorization: `${token}` },
        });

        const companyData = response.data.data;
        form.setFieldsValue({
          company_code: companyData.company_code,
          company_name: companyData.company_name,
          pic_name: companyData.pic_company?.name,
          pic_phone: companyData.pic_company?.phone,
          pic_email: companyData.pic_company?.email,
          is_erlangga: companyData.is_erlangga,
          billing_address: companyData.billing_address,
          tax_number: companyData.tax_number,
        });
        setLoading(false);
      } catch (error) {
        Swal.fire('Error', 'Gagal mengambil data perusahaan', 'error');
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id_company, form]);

  const onFinish = async (values) => {
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...values,
        company_code: form.getFieldValue('company_code'), // Tetap gunakan kode asli
        is_erlangga: values.is_erlangga || 0,
      };

      await axios.put(`${baseUrl}/nimda/company/update/${id_company}`, payload, {
        headers: { Authorization: `${token}` },
      });

      Swal.fire('Berhasil', 'Perusahaan berhasil diperbarui', 'success');
      navigate('/dashboard/company');
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat memperbarui perusahaan', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-500 py-10">Memuat...</div>;

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Card title={`EDIT PERUSAHAAN - ${form.getFieldValue('company_name') || 'Perusahaan'}`} className="mb-8">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* INFORMASI PERUSAHAAN */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI PERUSAHAAN</h3>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Kode Perusahaan"
                  name="company_code"
                  rules={[{ required: true, message: 'Kode perusahaan diperlukan!' }]}
                >
                  <Input
                    disabled
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nama Perusahaan"
                  name="company_name"
                  rules={[{ required: true, message: 'Masukkan nama perusahaan!' }]}
                >
                  <Input placeholder="Masukkan Nama Perusahaan" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nama PIC"
                  name="pic_name"
                >
                  <Input placeholder="Masukkan Nama PIC" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Telepon PIC"
                  name="pic_phone"
                >
                  <Input placeholder="Masukkan Telepon PIC" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Email PIC"
                  name="pic_email"
                  rules={[{ type: 'email', message: 'Email tidak valid!' }]}
                >
                  <Input placeholder="Masukkan Email PIC" className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Status Erlangga"
                  name="is_erlangga"
                >
                  <Radio.Group>
                    <Radio value={1}>Ya</Radio>
                    <Radio value={0}>Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
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
            </Row>
            <Row gutter={[8, 8]} className="flex flex-col sm:flex-row">
              <Col xs={24} sm={6}>
                <Form.Item
                  label="Nomor Pajak"
                  name="tax_number"
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

export default EditCompany;
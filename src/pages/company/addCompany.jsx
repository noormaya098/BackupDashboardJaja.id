import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Radio, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseUrl } from '@/configs';

const AddCompany = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch kode terakhir untuk generate company_code
  useEffect(() => {
    const fetchLastCompanyCode = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${baseUrl}/nimda/company/get-company`, {
          headers: { Authorization: `${token}` },
          params: { page: 1, limit: 1 }, // Ambil data terakhir
        });

        let nextNumber = 357952; // Default dimulai dari CJ357952
        const lastCompany = response.data.data[0];
        if (lastCompany && lastCompany.company_code) {
          const lastCodeNumber = parseInt(lastCompany.company_code.replace('CJ', ''), 10);
          nextNumber = lastCodeNumber + 1; // Tambah 1 dari kode terakhir
        }
        const newCode = `CJ${nextNumber}`; // Format CJ + nomor tanpa padding nol
        setGeneratedCode(newCode);
        form.setFieldsValue({ company_code: newCode });
      } catch (error) {
        console.error('Error fetching last company code:', error);
        Swal.fire('Error', 'Gagal mengambil kode terakhir', 'error');
      }
    };
    fetchLastCompanyCode();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...values,
        company_code: generatedCode, // Gunakan kode yang di-generate
        is_erlangga: values.is_erlangga || 0,
      };

      await axios.post(`${baseUrl}/nimda/company/create`, payload, {
        headers: { Authorization: `${token}` },
      });

      Swal.fire('Berhasil', 'Perusahaan berhasil ditambahkan', 'success');
      navigate('/dashboard/company');
    } catch (error) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menambahkan perusahaan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <Card title="TAMBAH PERUSAHAAN BARU" className="mb-8">
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
                    value={generatedCode}
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
          loading={loading}
          disabled={loading}
        >
          Simpan Perusahaan
        </Button>
      </div>
    </div>
  );
};

export default AddCompany;
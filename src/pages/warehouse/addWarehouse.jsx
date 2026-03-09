import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Space,
  notification 
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { TextArea } = Input;

const CreateWarehouse = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [codeWarehouse, setCodeWarehouse] = useState('');
  const navigate = useNavigate();

  // Fungsi untuk menghasilkan kode gudang otomatis
  const generateWarehouseCode = async () => {
    try {
      const response = await fetch(`${baseUrl}/nimda/warehouse/get-warehouse`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Tambahkan header autentikasi jika diperlukan
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.code === 200 && result.data.length > 0) {
        // Ambil kode gudang terakhir
        const lastWarehouse = result.data.sort((a, b) => 
          b.code_warehouse.localeCompare(a.code_warehouse)
        )[0];
        const lastCode = lastWarehouse.code_warehouse; // Misalnya, "GDG007"
        const lastNumber = parseInt(lastCode.replace('GDG', '')); // Ambil angka: 7
        const nextNumber = lastNumber + 1;
        const nextCode = `GDG${nextNumber.toString().padStart(3, '0')}`; // Misalnya, "GDG008"
        setCodeWarehouse(nextCode);
        form.setFieldsValue({ code_warehouse: nextCode });
      } else {
        // Jika tidak ada data, mulai dari GDG001
        setCodeWarehouse('GDG001');
        form.setFieldsValue({ code_warehouse: 'GDG001' });
      }
    } catch (error) {
      notification.error({
        message: 'Gagal Mengambil Kode Gudang',
        description: 'Tidak dapat mengambil kode gudang terakhir. Menggunakan GDG001.',
      });
      setCodeWarehouse('GDG001');
      form.setFieldsValue({ code_warehouse: 'GDG001' });
    }
  };

  // Panggil generateWarehouseCode saat komponen dimuat
  useEffect(() => {
    generateWarehouseCode();
  }, []);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        code_warehouse: values.code_warehouse,
        name_warehouse: values.name_warehouse,
        address_warehouse: values.address_warehouse || '',
        city: values.city || '',
        province: values.province || '',
        is_active: values.is_active,
      };

      const response = await fetch(`${baseUrl}/nimda/warehouse/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Tambahkan header autentikasi jika diperlukan
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.code === 201) {
        notification.success({
          message: 'Gudang Berhasil Ditambahkan',
          description: `Gudang ${values.name_warehouse} telah berhasil ditambahkan.`,
        });
        form.resetFields();
        // Arahkan ke halaman detail gudang menggunakan id_warehouse dari response
        navigate(`/dashboard/warehouse/detail-warehouse/${result.data.id_warehouse}`);
        return;
      } else {
        throw new Error(result.message || 'Gagal menambahkan gudang');
      }
    } catch (error) {
      notification.error({
        message: 'Gagal Menambahkan Gudang',
        description: error.message || 'Terjadi kesalahan saat menyimpan gudang.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-2 sm:px-0">
      <style>
        {`
          .ant-form-item {
            margin-bottom: 8px !important;
          }
          .ant-form-item-label > label {
            margin-bottom: 2px !important;
          }
        `}
      </style>
      <Card title="TAMBAH GUDANG BARU" className="mb-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {/* INFORMASI DASAR */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">INFORMASI DASAR</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Form.Item 
                name="name_warehouse" 
                label="Nama Gudang" 
                rules={[{ required: true, message: 'Mohon masukkan nama gudang' }]}
              >
                <Input 
                  placeholder="Masukkan nama gudang" 
                  className="w-full" 
                />
              </Form.Item>

              <Form.Item 
                name="code_warehouse" 
                label="Kode Gudang"
                rules={[{ required: true, message: 'Mohon masukkan kode gudang' }]}
              >
                <Input 
                  placeholder="Kode gudang (otomatis)" 
                  className="w-full" 
                  disabled
                  value={codeWarehouse}
                />
              </Form.Item>

              <Form.Item 
                name="is_active" 
                label="Status Gudang"
                rules={[{ required: true, message: 'Mohon pilih status gudang' }]}
              >
                <Select 
                  placeholder="Pilih status gudang" 
                  className="w-full"
                >
                  <Option value={true}>Aktif</Option>
                  <Option value={false}>Non-Aktif</Option>
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Form.Item 
                name="address_warehouse" 
                label="Alamat"
              >
                <TextArea 
                  placeholder="Masukkan alamat gudang" 
                  rows={3} 
                  className="w-full" 
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item 
                name="city" 
                label="Kota"
              >
                <Input 
                  placeholder="Masukkan kota" 
                  className="w-full" 
                />
              </Form.Item>

              <Form.Item 
                name="province" 
                label="Provinsi"
              >
                <Input 
                  placeholder="Masukkan provinsi" 
                  className="w-full" 
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Card>

      <div className="flex justify-start sm:justify-end mt-8">
        <Space>
          <Button
            type="default"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => navigate('/dashboard/warehouse')}
            icon={<ArrowLeftOutlined />}
          >
            Kembali
          </Button>
          <Button 
            type="default" 
            onClick={() => form.resetFields()}
          >
            Reset
          </Button>
          <Button
            type="primary"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-md"
            onClick={() => form.submit()}
            loading={loading}
            disabled={loading}
            icon={<SaveOutlined />}
          >
            Simpan Gudang
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default CreateWarehouse;
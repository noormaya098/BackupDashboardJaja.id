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
import { useNavigate, useParams } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { Option } = Select;
const { TextArea } = Input;

const EditWarehouse = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState(null); // Simpan data awal
  const navigate = useNavigate();
  const { id_warehouse } = useParams();

  // Fetch data gudang untuk mengisi form
  useEffect(() => {
    const fetchWarehouse = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${baseUrl}/nimda/warehouse/${id_warehouse}/get-warehouse-detail`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Tambahkan header autentikasi jika diperlukan
              // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const result = await response.json();
        if (result.code === 200) {
          const data = result.data;
          setWarehouseData(data); // Simpan data untuk payload
          form.setFieldsValue({
            code_warehouse: data.code_warehouse,
            name_warehouse: data.name_warehouse,
            address_warehouse: data.address_warehouse,
            city: data.city,
            province: data.province,
            is_active: data.is_active,
          });
        } else {
          throw new Error(result.message || 'Gagal memuat data gudang');
        }
      } catch (error) {
        notification.error({
          message: 'Gagal Memuat Data',
          description: error.message || 'Tidak dapat memuat data gudang.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouse();
  }, [id_warehouse, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        code_warehouse: warehouseData?.code_warehouse || values.code_warehouse, // Gunakan nilai awal
        name_warehouse: values.name_warehouse,
        address_warehouse: values.address_warehouse || '',
        city: values.city || '',
        province: values.province || '',
        is_active: values.is_active,
      };

      const response = await fetch(
        `${baseUrl}/nimda/warehouse/update/${id_warehouse}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Tambahkan header autentikasi jika diperlukan
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.code === 200) {
        notification.success({
          message: 'Gudang Berhasil Diperbarui',
          description: `Gudang ${values.name_warehouse} telah berhasil diperbarui.`,
        });
        navigate(`/dashboard/warehouse/detail-warehouse/${id_warehouse}`);
        return;
      } else {
        throw new Error(result.message || 'Gagal memperbarui gudang');
      }
    } catch (error) {
      notification.error({
        message: 'Gagal Memperbarui Gudang',
        description: error.message || 'Terjadi kesalahan saat memperbarui gudang.',
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
      <Card title={`EDIT GUDANG - ${id_warehouse}`} className="mb-8">
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
                  placeholder="Kode gudang"
                  className="w-full"
                  disabled
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
            Simpan Perubahan
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default EditWarehouse;
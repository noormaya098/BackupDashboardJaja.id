import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Select, Switch, message, Spin, InputNumber } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const AddBanner = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();

  const handleBeforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Hanya file gambar yang diizinkan');
    }
    return isImage ? true : Upload.LIST_IGNORE;
  };

  const handleOnChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('Silakan upload gambar banner');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const formData = new FormData();

      // Append file
      if (fileList[0] && fileList[0].originFileObj) {
        formData.append('banner', fileList[0].originFileObj);
      }

      // Append form data
      formData.append('link', values.link || '');
      formData.append('type', values.type || 'web');
      formData.append('is_platform', values.is_platform ? 1 : 0);
      formData.append('status', values.status ? 1 : 0);
      formData.append('sort', values.sort || 1);

      const response = await fetch(`${baseUrl}/seller/v2/banner`, {
        method: 'POST',
        headers: {
          Authorization: `${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success || result.code === 200) {
        message.success('Banner berhasil ditambahkan');
        navigate('/dashboard/banner');
      } else {
        throw new Error(result.message || 'Gagal menambahkan banner');
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card>
        <div className="mb-5 flex items-center gap-2">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/dashboard/banner')}
            className="text-blue-500"
          >
            Kembali
          </Button>
          <h1 className="text-lg font-semibold">Tambah Banner Baru</h1>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            type: 'web',
            is_platform: true,
            status: true,
            sort: 1,
          }}
        >
          {/* Image Upload */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Upload Gambar Banner</span>}
            required
          >
            <Upload
              listType="picture"
              beforeUpload={handleBeforeUpload}
              onChange={handleOnChange}
              maxCount={1}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} className="rounded-md">
                Pilih Gambar
              </Button>
            </Upload>
          </Form.Item>

          {/* Link Input */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Link</span>}
            name="link"
            rules={[{ required: true, message: 'Link tidak boleh kosong' }]}
          >
            <Input
              placeholder="https://example.com"
              className="rounded-md p-2 text-xs"
              size="middle"
            />
          </Form.Item>

          {/* Type Web Select */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Type Web</span>}
            name="type"
            rules={[{ required: true, message: 'Pilih type web' }]}
          >
            <Select className="rounded-md" size="middle">
              <Option value="web">Web</Option>
              <Option value="mobile">Mobile</Option>
              <Option value="desktop">Desktop</Option>
            </Select>
          </Form.Item>

          {/* Sort Order */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Urutan (Sort)</span>}
            name="sort"
            rules={[{ required: true, message: 'Urutan tidak boleh kosong' }]}
          >
            <InputNumber
              min={1}
              max={100}
              className="w-full rounded-md"
              size="middle"
            />
          </Form.Item>

          {/* is_platform Switch */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Aktif di Platform</span>}
            name="is_platform"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          {/* Status Switch */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Status</span>}
            name="status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-500 border-blue-500 rounded-md font-medium w-full"
              size="large"
            >
              Simpan Banner
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddBanner;

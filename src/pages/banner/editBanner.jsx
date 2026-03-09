import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, Select, Switch, message, Spin, InputNumber } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { baseUrl } from '@/configs';

const { TextArea } = Input;
const { Option } = Select;

const EditBanner = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [bannerData, setBannerData] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch banner detail
  useEffect(() => {
    const fetchBannerDetail = async () => {
      setFetching(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan');

        const response = await fetch(`${baseUrl}/nimda/banner-slider/${id}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `${token}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          setBannerData(data);

          // Set form values - map API fields to form fields
          form.setFieldsValue({
            link: data.link || '',
            type: data.type || 'web',
            is_platform: data.is_platform ? true : false,
            status: data.status ? true : false,
            sort: data.sort || 1,
          });

          // Set image preview if exists
          if (data.banner_url) {
            setFileList([
              {
                uid: '-1',
                name: data.nama_file || `banner-${id}`,
                status: 'done',
                url: data.banner_url,
                thumbUrl: data.banner_url,
              },
            ]);
          }
        } else {
          throw new Error(result.message || 'Gagal mengambil data banner');
        }
      } catch (error) {
        console.error('Error fetching banner detail:', error);
        message.error(`Error: ${error.message}`);
        navigate('/dashboard/banner');
      } finally {
        setFetching(false);
      }
    };

    fetchBannerDetail();
  }, [id, form, navigate]);

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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const formData = new FormData();

      // Append file only if new file is selected (not from server)
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('banner', fileList[0].originFileObj);
      }

      // Append form data
      formData.append('link', values.link || '');
      formData.append('type', values.type || 'web');
      formData.append('is_platform', values.is_platform ? 1 : 0);
      formData.append('status', values.status ? 1 : 0);
      formData.append('sort', values.sort || 1);

      const response = await fetch(`${baseUrl}/nimda/banner-slider/${id}`, {
        method: 'PUT',
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
        message.success('Banner berhasil diperbarui');
        navigate('/dashboard/banner');
      } else {
        throw new Error(result.message || 'Gagal memperbarui banner');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="mb-8 px-2 sm:px-0">
        <Card>
          <div className="text-center py-10">
            <Spin size="large" tip="Memuat data banner..." />
          </div>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold">Edit Banner</h1>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* Image Upload */}
          <Form.Item
            label={<span className="font-medium text-gray-600">Gambar Banner</span>}
          >
            <Upload
              listType="picture"
              beforeUpload={handleBeforeUpload}
              onChange={handleOnChange}
              maxCount={1}
              accept="image/*"
              fileList={fileList}
            >
              <Button icon={<UploadOutlined />} className="rounded-md">
                Ganti Gambar
              </Button>
            </Upload>
            <p className="text-xs text-gray-500 mt-2">
              Biarkan kosong jika tidak ingin mengubah gambar
            </p>
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
              Simpan Perubahan
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditBanner;

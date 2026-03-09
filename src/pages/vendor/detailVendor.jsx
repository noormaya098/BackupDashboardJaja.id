import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Button, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, UserOutlined, ContactsOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title } = Typography;

const VendorDetail = () => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const { id_vendor } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVendorDetail = async () => {
      try {
        const response = await axios.get(`https://apidev.jaja.id/nimda/vendor/get-vendor-detail`, {
          params: { id_vendor }
        });

        setVendor(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vendor detail:', error);
        setLoading(false);
      }
    };

    fetchVendorDetail();
  }, [id_vendor]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await axios.post('https://apidev.jaja.id/nimda/vendor/export/send', {
        id_vendor: Number(id_vendor),
      });

      Modal.success({
        title: 'Berhasil export vendor',
        content: (response && response.data && response.data.message) ? response.data.message : 'Export vendor berhasil',
        okText: 'OK',
        okButtonProps: { type: 'primary', style: { backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#ffffff' } },
      });
    } catch (error) {
      const messages = (error && error.response && error.response.data && error.response.data.error && Array.isArray(error.response.data.error.error_full_messages))
        ? error.response.data.error.error_full_messages
        : [];

      Modal.error({
        title: 'Gagal export vendor',
        content: messages.length ? messages.join('\n') : ((error && error.response && error.response.data && error.response.data.message) ? error.response.data.message : 'Terjadi kesalahan'),
        okText: 'OK',
        okButtonProps: { type: 'primary', style: { backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#ffffff' } },
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-0 bg-gradient-to-br min-h-screen">
      <Card 
        className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl"
        bordered={false}
      >
        <div className="flex items-center mb-6">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            className="mr-4 bg-blue-50 text-blue-600 border-none hover:bg-blue-100"
          >
            Kembali
          </Button>
          <Title 
            level={2} 
            className="mb-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Detail Vendor
          </Title>
          <Button
            onClick={handleExport}
            loading={exportLoading}
            className="ml-auto bg-green-50 text-green-600 border-none hover:bg-green-100"
          >
            Export Vendor
          </Button>
        </div>

        <Descriptions 
          bordered 
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          className="mb-6 vendor-details"
          title={
            <div className="flex items-center text-blue-600">
              <UserOutlined className="mr-2" />
              Informasi Vendor
            </div>
          }
        >
          <Descriptions.Item label="ID Vendor" className="font-medium">{vendor.id_vendor}</Descriptions.Item>
          <Descriptions.Item label="Nama Vendor">{vendor.display_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nama Perusahaan">{vendor.company_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Kontak PIC">
            {`${vendor.pic_vendor.title || ''} ${vendor.pic_vendor.first_name || ''} ${vendor.pic_vendor.middle_name || ''} ${vendor.pic_vendor.last_name || ''}`.trim() || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions 
          bordered 
          title={
            <div className="flex items-center text-green-600">
              <ContactsOutlined className="mr-2" />
              Informasi Kontak
            </div>
          }
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          className="mb-6 vendor-contact"
        >
          <Descriptions.Item label="Telepon">{vendor.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Fax">{vendor.fax || '-'}</Descriptions.Item>
          <Descriptions.Item label="Mobile">{vendor.mobile || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{vendor.email || '-'}</Descriptions.Item>
        </Descriptions>

        <Descriptions 
          bordered 
          title={
            <div className="flex items-center text-purple-600">
              <InfoCircleOutlined className="mr-2" />
              Detail Alamat
            </div>
          }
          column={1}
          className="mb-6 vendor-address"
        >
          <Descriptions.Item label="Alamat Billing">{vendor.billing_address || '-'}</Descriptions.Item>
          <Descriptions.Item label="Alamat Utama">{vendor.address || '-'}</Descriptions.Item>
        </Descriptions>

        <Descriptions 
          bordered 
          title={
            <div className="flex items-center text-orange-600">
              <InfoCircleOutlined className="mr-2" />
              Informasi Tambahan
            </div>
          }
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Nomor Pajak">{vendor.tax_no || '-'}</Descriptions.Item>
          <Descriptions.Item label="Default AR Account">{vendor.default_ar_account_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="Default AP Account">{vendor.default_ap_account_name || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default VendorDetail;
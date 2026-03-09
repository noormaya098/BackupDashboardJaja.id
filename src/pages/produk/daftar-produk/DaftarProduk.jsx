import { Card, Typography, Tabs, ConfigProvider } from 'antd';
import React from 'react';
import Semua from './Semua';
import MasterKategori from './MasterKategori';
import { FileTextOutlined, AppstoreOutlined } from '@ant-design/icons';

const { Title } = Typography;

function DaftarProduk() {
  const items = [
    {
      key: '1',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Daftar Produk
        </span>
      ),
      children: <Semua />,
    },
    {
      key: '2',
      label: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined />
          Master Kategori
        </span>
      ),
      children: <MasterKategori />,
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Master Management
            </Title>
          </div>
          <div className="px-4 pb-4">
            <Tabs defaultActiveKey="1" items={items} />
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

export default DaftarProduk;
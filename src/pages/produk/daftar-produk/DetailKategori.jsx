import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Tag, Button, Spin, Typography, ConfigProvider } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Title } = Typography;

function DetailKategori() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/sign-in');
          return;
        }

        const response = await axios.get(`${baseUrl}/nimda/category-v2/${id}`, {
          headers: {
            Authorization: `${token}`,
          },
        });

        if (response.data && response.data.data) {
          setCategory(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Gagal mengambil detail kategori');
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const columns = [
    {
      title: 'Nama Sub Kategori',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Persediaan',
      dataIndex: 'persediaan',
      key: 'persediaan',
      render: (text) => text || '-',
    },
    {
      title: 'Kode Persediaan',
      dataIndex: 'kode_persediaan',
      key: 'kode_persediaan',
      render: (text) => text || '-',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active === 1 ? 'green' : 'red'}>
          {active === 1 ? 'Aktif' : 'Non-Aktif'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading detail kategori..." />
      </div>
    );
  }

  if (error || !category) {
    return <div className="p-4 text-center text-red-500">{error || 'Data tidak ditemukan'}</div>;
  }

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="p-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          Kembali
        </Button>

        <div className="p-3 m-0 text-left">
          <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
            Detail Kategori: {category.name}
          </Title>
        </div>

        <Card className="shadow-sm mb-6">
          <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
            <Descriptions.Item label="ID Kategori">{category.id_category}</Descriptions.Item>
            <Descriptions.Item label="Nama Kategori">{category.name}</Descriptions.Item>
            <Descriptions.Item label="Kode">{category.code}</Descriptions.Item>
            <Descriptions.Item label="Brand Type">
              <Tag color={category.brand_type === 'JAJAID' ? 'blue' : 'orange'}>
                {category.brand_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Level">{category.level}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={category.is_active === 1 ? 'green' : 'red'}>
                {category.is_active === 1 ? 'Aktif' : 'Non-Aktif'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Persediaan">{category.persediaan || '-'}</Descriptions.Item>
            <Descriptions.Item label="Kode Persediaan">{category.kode_persediaan || '-'}</Descriptions.Item>
            <Descriptions.Item label="Dibuat Pada">{new Date(category.created_at).toLocaleString('id-ID')}</Descriptions.Item>
          </Descriptions>
        </Card>

        {category.children && category.children.length > 0 && (
          <Card title="Sub Kategori (Children)" className="shadow-sm">
            <Table
              dataSource={category.children}
              columns={columns}
              rowKey="id_category"
              pagination={false}
            />
          </Card>
        )}
      </div>
    </ConfigProvider>
  );
}

export default DetailKategori;

import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Spin, message, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal } from 'antd';
import { baseUrl } from '@/configs';

const DetailBanner = () => {
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch banner detail
  useEffect(() => {
    const fetchBannerDetail = async () => {
      setLoading(true);
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
          setBannerData(result.data);
        } else {
          throw new Error(result.message || 'Gagal mengambil data banner');
        }
      } catch (error) {
        console.error('Error fetching banner detail:', error);
        message.error(`Error: ${error.message}`);
        navigate('/dashboard/banner');
      } finally {
        setLoading(false);
      }
    };

    fetchBannerDetail();
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`/dashboard/banner/edit/${id}`);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: <span className="text-base font-semibold text-gray-900">Konfirmasi Hapus</span>,
      content: <span className="text-gray-600">Apakah Anda yakin ingin menghapus banner ini?</span>,
      okText: 'Ya',
      cancelText: 'Tidak',
      okButtonProps: {
        className: 'bg-red-500 border-red-500 text-white rounded-md px-4 py-1 font-medium hover:bg-red-600',
      },
      cancelButtonProps: {
        className: 'bg-gray-300 border-gray-300 text-gray-600 rounded-md px-4 py-1 font-medium hover:bg-gray-400',
      },
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${baseUrl}/nimda/banner-slider/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) throw new Error(`Gagal menghapus: ${response.status}`);

          Modal.success({
            content: <span className="text-green-600">Banner berhasil dihapus</span>,
            okButtonProps: { className: 'rounded-md bg-green-500 border-green-500' },
            onOk: () => navigate('/dashboard/banner'),
          });
        } catch (error) {
          console.error('Error deleting banner:', error);
          Modal.error({
            title: <span className="text-red-600">Error</span>,
            content: `Gagal menghapus: ${error.message}`,
            okButtonProps: { className: 'rounded-md bg-red-500 border-red-500' },
          });
        }
      },
    });
  };

  if (loading) {
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
          <h1 className="text-lg font-semibold">Detail Banner</h1>
        </div>

        {bannerData && (
          <>
            {/* Banner Image */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3">Gambar Banner</h3>
              {bannerData.banner_url ? (
                <img
                  src={bannerData.banner_url}
                  alt="Banner"
                  className="max-w-full h-auto rounded-md shadow-md"
                  style={{ maxHeight: '400px' }}
                />
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center rounded-md">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* Banner Details */}
            <Descriptions bordered column={1} className="mb-6">
              <Descriptions.Item label="ID" labelStyle={{ fontWeight: 600 }}>
                {bannerData.id_data}
              </Descriptions.Item>
              <Descriptions.Item label="Nama File" labelStyle={{ fontWeight: 600 }}>
                {bannerData.nama_file || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Link" labelStyle={{ fontWeight: 600 }}>
                <a href={bannerData.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {bannerData.link}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Type Web" labelStyle={{ fontWeight: 600 }}>
                {bannerData.type || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Urutan (Sort)" labelStyle={{ fontWeight: 600 }}>
                {bannerData.sort || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status Aktif" labelStyle={{ fontWeight: 600 }}>
                <Tag color={bannerData.is_platform ? 'green' : 'red'}>
                  {bannerData.is_platform ? 'Aktif' : 'Tidak Aktif'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status Umum" labelStyle={{ fontWeight: 600 }}>
                <Tag color={bannerData.status === 0 ? 'blue' : 'volcano'}>
                  {bannerData.status === 0 ? 'Aktif' : 'Tidak Aktif'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Admin" labelStyle={{ fontWeight: 600 }}>
                {bannerData.nama_admin || '-'}
              </Descriptions.Item>
              {bannerData.created_date && (
                <Descriptions.Item label="Dibuat" labelStyle={{ fontWeight: 600 }}>
                  {bannerData.created_date} {bannerData.created_time}
                </Descriptions.Item>
              )}
              {bannerData.date_added && (
                <Descriptions.Item label="Tanggal Ditambahkan" labelStyle={{ fontWeight: 600 }}>
                  {new Date(bannerData.date_added).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                className="bg-green-500 border-green-500 rounded-md"
              >
                Edit
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                className="rounded-md"
              >
                Hapus
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default DetailBanner;

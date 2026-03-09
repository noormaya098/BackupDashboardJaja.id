import React, { useState, useEffect } from 'react';
import { Card, Button, Spin, Modal, Typography, Space, Tag, message, Form, Input, Select, Switch, Upload, InputNumber, Pagination } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SwapOutlined,
  UploadOutlined, FileTextOutlined, LinkOutlined, IdcardOutlined,
  DeploymentUnitOutlined, SortDescendingOutlined, FileImageOutlined,
  UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Option } = Select;

const BannerList = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalBanners, setTotalBanners] = useState(0);
  const [filter, setFilter] = useState('all'); // all | active | inactive
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('id_data');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal states
  const [modalMode, setModalMode] = useState(null); // 'add', 'edit', 'detail', null
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const fetchBanners = async (page = 1, limit = 10, sort_by = 'id_data', sort_order = 'DESC') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');

      const url = new URL(`${baseUrl}/nimda/banner-slider-v2/get-banners`);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);
      url.searchParams.append('sort_by', sort_by);
      url.searchParams.append('sort_order', sort_order);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `${token}`, // Removed leading space
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      console.log('API Response:', result); // Log for debugging

      if (result.code === 200 && result.data) {
        // Map API response to standardized format
        const formattedBanners = result.data.map((item) => ({
          id: item.id_data,
          banner_image: item.banner_url,
          banner_url: item.banner_url,
          link: item.link,
          type_web: item.type,
          is_platform: item.is_platform ? 1 : 0,
          status: item.status,
          sort: item.sort,
          nama_file: item.nama_file,
          created_date: item.created_date,
          created_time: item.created_time,
          nama_admin: item.nama_admin,
          date_added: item.date_added,
          id_admin: item.id_admin,
        }));

        console.log('Formatted Banners:', formattedBanners);
        setBanners(formattedBanners);
        const total = result.pagination?.total ?? formattedBanners.length;
        setTotalBanners(total);
      } else {
        console.error('Failed to fetch banners:', result.message || 'Unknown error');
        message.error(`Gagal mengambil data: ${result.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(currentPage, pageSize, sortBy, sortOrder);
  }, [currentPage, pageSize, sortBy, sortOrder]);

  // Client-side filtering + pagination
  // Client-side filtering logic
  const filteredBanners = banners.filter((b) => {
    // If filter is all and query is empty, allow all
    if (filter === 'all' && (!query || query.trim() === '')) return true;

    // Filter by status
    if (filter === 'active' && b.status !== 0) return false;
    if (filter === 'inactive' && b.status === 0) return false;

    // Filter by query
    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      return (
        (b.nama_file && b.nama_file.toLowerCase().includes(q)) ||
        (b.link && b.link.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate pagination
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBanners = filteredBanners; // Server-side pagination is active

  // Modal handlers
  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedBanner(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({
      type_web: 'web',
      is_platform: true,
      status: true,
      sort: 1,
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = async (bannerId) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/nimda/banner-slider-v2/detail-banner/${bannerId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `${token}`,
        },
      });

      if (!response.ok) throw new Error('Gagal fetch detail banner');
      const result = await response.json();

      if (result.code === 200 && result.data) {
        const data = result.data;
        setSelectedBanner(data);
        setModalMode('edit');

        form.setFieldsValue({
          link: data.link || '',
          type_web: data.type || 'web',
          is_platform: data.is_platform ? true : false,
          // API: 0 = active, 1 = inactive -> Switch checked means active
          status: data.status === 0 ? true : false,
          sort: data.sort || 1,
        });

        if (data.banner_url) {
          setFileList([
            {
              uid: '-1',
              name: data.nama_file || `banner-${bannerId}`,
              status: 'done',
              url: data.banner_url,
              thumbUrl: data.banner_url,
            },
          ]);
        } else {
          setFileList([]);
        }

        setModalVisible(true);
      }
    } catch (error) {
      message.error(`Error: ${error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDetailModal = async (bannerId) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/nimda/banner-slider-v2/detail-banner/${bannerId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `${token}`,
        },
      });

      if (!response.ok) throw new Error('Gagal fetch detail banner');
      const result = await response.json();

      if (result.code === 200 && result.data) {
        setSelectedBanner(result.data);
        setModalMode('detail');
        setModalVisible(true);
      }
    } catch (error) {
      message.error(`Error: ${error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setModalMode(null);
    setSelectedBanner(null);
    setFileList([]);
    form.resetFields();
  };

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

  const handleSubmitModal = async (values) => {
    if (modalMode === 'add' && fileList.length === 0) {
      message.error('Silakan upload gambar banner');
      return;
    }

    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token tidak ditemukan');

      const formData = new FormData();

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('banner', fileList[0].originFileObj);
      }

      formData.append('link', values.link || '');
      formData.append('type', values.type_web || 'web');
      formData.append('is_platform', values.is_platform ? 1 : 0);
      // API expects 0 = active, 1 = inactive. Our Switch is checked = active.
      formData.append('status', values.status ? 0 : 1);
      formData.append('sort', values.sort || 1);

      // Use nimda/banner-slider-v2 for create and update
      const url = modalMode === 'add'
        ? `${baseUrl}/nimda/banner-slider-v2/create-banner`
        : `${baseUrl}/nimda/banner-slider-v2/edit-banner/${selectedBanner.id_data}`;

      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success || result.code === 200 || result.code === 201) {
        message.success(modalMode === 'add' ? 'Banner berhasil ditambahkan' : 'Banner berhasil diperbarui');
        handleCloseModal();
        fetchBanners(currentPage, pageSize, sortBy, sortOrder);
      } else {
        throw new Error(result.message || `Gagal ${modalMode === 'add' ? 'menambahkan' : 'memperbarui'} banner`);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error(`Error: ${error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setToggleLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 1 ? 0 : 1; // local state inversion

      // Call v2 toggle endpoint
      const response = await fetch(`${baseUrl}/nimda/banner-slider-v2/toggle-status/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.success || result.code === 200) {
        message.success('Status berhasil diubah');
        setBanners((prev) =>
          prev.map((banner) =>
            banner.id === id ? { ...banner, status: newStatus } : banner
          )
        );
      } else {
        message.error(`Gagal mengubah status: ${result.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      message.error(`Error: ${error.message}`);
    } finally {
      setToggleLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteBanner = async (id) => {
    Modal.confirm({
      title: <span className="text-base font-semibold text-gray-900">Konfirmasi Hapus</span>,
      content: <span className="text-gray-600">Apakah Anda yakin ingin menghapus banner ini?</span>,
      okText: 'Ya',
      cancelText: 'Tidak',
      okButtonProps: {
        style: { ...deleteButtonStyle, padding: '6px 16px', borderRadius: 6 },
      },
      cancelButtonProps: {
        style: { backgroundColor: '#e5e7eb', borderColor: '#d1d5db', color: '#374151', padding: '6px 16px', borderRadius: 6 },
      },
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${baseUrl}/nimda/banner-slider-v2/delete-banner/${id}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { Authorization: `${token}` } : {}),
            },
          });

          if (!response.ok) throw new Error(`Gagal menghapus: ${response.status}`);

          setBanners((prev) => prev.filter((banner) => banner.id !== id));
          Modal.success({
            content: <span className="text-green-600">Banner berhasil dihapus</span>,
            okButtonProps: { className: 'rounded-md bg-green-500 border-green-500' },
          });
        } catch (error) {
          console.error('Error deleting banner:', error);
          Modal.error({
            title: <span className="text-red-600">Error</span>,
            content: `Gagal menghapus: ${error.message}`,
            okButtonProps: { style: { ...modalActionStyle, borderRadius: 6 } },
          });
        }
      },
    });
  };

  // Detail item helper
  const DetailItem = ({ label, value, icon }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-gray-100">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
        <span className="text-sm font-semibold text-gray-700 truncate">{value}</span>
      </div>
    </div>
  );

  // Render detail content
  const renderDetailContent = () => {
    if (!selectedBanner) return null;
    return (
      <div className="space-y-5">
        {/* Banner Preview Section - Smaller Height */}
        <div className="relative group">
          <div className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest z-10 border-x border-gray-100">
            Preview Banner
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 transition-all duration-300 group-hover:border-blue-100 group-hover:shadow-md">
            {selectedBanner.banner_url ? (
              <img
                src={selectedBanner.banner_url}
                alt="Banner Detail"
                className="w-full h-auto max-h-[180px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-32 flex flex-col items-center justify-center text-gray-300">
                <FileImageOutlined style={{ fontSize: 32 }} />
                <span className="mt-2 text-xs font-medium">Gambar tidak tersedia</span>
              </div>
            )}
          </div>
        </div>

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem
            label="Banner ID"
            value={`ID-${selectedBanner.id_data}`}
            icon={<IdcardOutlined className="text-blue-500" />}
          />
          <DetailItem
            label="Type Platform"
            value={selectedBanner.type || 'Web'}
            icon={<DeploymentUnitOutlined className="text-purple-500" />}
          />
          <DetailItem
            label="Redirect URL"
            value={selectedBanner.link && selectedBanner.link !== '#' ? (
              <a href={selectedBanner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline underline-offset-4 decoration-blue-200">
                {selectedBanner.link}
              </a>
            ) : <span className="text-gray-400 italic font-normal">No Redirect Link</span>}
            icon={<LinkOutlined className="text-indigo-500" />}
          />
          <DetailItem
            label="Display Priority"
            value={`Seq: ${selectedBanner.sort || '1'}`}
            icon={<SortDescendingOutlined className="text-amber-500" />}
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-6 px-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Visibility Status</span>
            <Tag color={selectedBanner.status === 0 ? 'success' : 'error'} className="m-0 rounded-full px-4 py-0.5 border-none font-bold text-xs uppercase tracking-tight shadow-sm">
              {selectedBanner.status === 0 ? '● Online' : '○ Offline'}
            </Tag>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Platform Target</span>
            <Tag color={selectedBanner.is_platform ? 'geekblue' : 'default'} className="m-0 rounded-full px-4 py-0.5 border-none font-bold text-xs uppercase tracking-tight shadow-sm">
              {selectedBanner.is_platform ? 'Cross Platform' : 'Web Only'}
            </Tag>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <UserOutlined style={{ fontSize: 12 }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Publisher</span>
              <span className="text-xs font-semibold text-gray-600">{selectedBanner.nama_admin || 'Unknown Admin'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <CalendarOutlined style={{ fontSize: 12 }} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Publish Date</span>
              <span className="text-xs font-semibold text-gray-600">
                {selectedBanner.created_date ? `${selectedBanner.created_date} • ${selectedBanner.created_time || ''}` : 'No date info'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal footer buttons style: single color, no hover
  const modalActionStyle = {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
    color: '#ffffff',
    boxShadow: 'none',
  };

  // Delete button style (red)
  const deleteButtonStyle = {
    backgroundColor: '#ff4d4f',
    borderColor: '#ff4d4f',
    color: '#ffffff',
    boxShadow: 'none',
  };

  // Table header style
  const thStyle = {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    color: '#374151',
    whiteSpace: 'nowrap',
  };

  // Table cell style
  const tdStyle = {
    padding: '10px 12px',
    verticalAlign: 'middle',
  };

  const renderModalFooter = () => {
    if (modalMode === 'detail') {
      return [
        <Button
          key="close"
          onClick={handleCloseModal}
          style={modalActionStyle}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
        >
          Tutup
        </Button>,
      ];
    }

    return [
      <Button
        key="cancel"
        onClick={handleCloseModal}
        style={modalActionStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
      >
        Batal
      </Button>,
      <Button
        key="submit"
        type="primary"
        loading={modalLoading}
        onClick={() => form.submit()}
        style={modalActionStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
      >
        {modalMode === 'add' ? 'Tambahkan' : 'Perbarui'}
      </Button>,
    ];
  };

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card>
        <div className="p-3 m-0 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar Banner
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModal}
              style={{ backgroundColor: '#007BFF', borderColor: '#007BFF' }}
              className="w-full sm:w-auto"
            >
              Tambah Banner
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Spin size="large" tip="Memuat data banner..." />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Tidak ada banner. Silakan tambahkan banner baru.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 pl-2 pr-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filter} onChange={(val) => { setFilter(val); setCurrentPage(1); }} style={{ width: 140 }}>
                  <Option value="all">Semua</Option>
                  <Option value="active">Aktif</Option>
                  <Option value="inactive">Tidak Aktif</Option>
                </Select>

                <Select value={sortBy} onChange={(val) => { setSortBy(val); setCurrentPage(1); }} style={{ width: 160 }}>
                  <Option value="id_data">Sort by ID</Option>
                  <Option value="date_added">Sort by Date Added</Option>
                  <Option value="created_date">Sort by Created Date</Option>
                  <Option value="sort">Sort by Order</Option>
                </Select>

                <Select value={sortOrder} onChange={(val) => { setSortOrder(val); setCurrentPage(1); }} style={{ width: 110 }}>
                  <Option value="DESC">DESC</Option>
                  <Option value="ASC">ASC</Option>
                </Select>

                <Input placeholder="Cari file atau link" value={query} onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} style={{ width: 280 }} />
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f7fa', borderBottom: '2px solid #e8ecf0' }}>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Gambar</th>
                    <th style={thStyle}>Nama File</th>
                    <th style={thStyle}>Link</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Sort</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Platform</th>
                    <th style={thStyle}>Admin</th>
                    <th style={thStyle}>Tanggal</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBanners.map((banner, index) => (
                    <tr
                      key={banner.id}
                      style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f7ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc')}
                    >
                      {/* No */}
                      <td style={tdStyle}>{startIndex + index + 1}</td>

                      {/* Gambar */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div
                          style={{ width: 72, height: 48, overflow: 'hidden', borderRadius: 6, cursor: 'pointer', border: '1px solid #e8ecf0', display: 'inline-block' }}
                          onClick={() => handleOpenDetailModal(banner.id)}
                        >
                          {banner.banner_image ? (
                            <img
                              src={banner.banner_image}
                              alt={`Banner ${banner.id}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: 10, color: '#9ca3af' }}>No Img</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Nama File */}
                      <td style={tdStyle}>
                        <span style={{ display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }} title={banner.nama_file}>
                          {banner.nama_file || '-'}
                        </span>
                      </td>

                      {/* Link */}
                      <td style={tdStyle}>
                        {banner.link && banner.link !== '#' ? (
                          <a href={banner.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff', textDecoration: 'none', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={banner.link}>
                            {banner.link}
                          </a>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>{banner.link || '-'}</span>
                        )}
                      </td>

                      {/* Type */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Tag color="blue" style={{ fontSize: 11 }}>{banner.type_web || '-'}</Tag>
                      </td>

                      {/* Sort */}
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                        {banner.sort ?? '-'}
                      </td>

                      {/* Status */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Tag color={banner.status === 0 ? 'success' : 'volcano'} style={{ fontSize: 11 }}>
                          {banner.status === 0 ? 'Aktif' : 'Tidak Aktif'}
                        </Tag>
                      </td>

                      {/* Platform */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Tag color={banner.is_platform ? 'geekblue' : 'default'} style={{ fontSize: 11 }}>
                          {banner.is_platform ? 'Ya' : 'Tidak'}
                        </Tag>
                      </td>

                      {/* Admin */}
                      <td style={tdStyle}>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{banner.nama_admin || '-'}</span>
                      </td>

                      {/* Tanggal */}
                      <td style={tdStyle}>
                        {banner.created_date ? (
                          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                            <div>{banner.created_date}</div>
                            <div style={{ color: '#9ca3af' }}>{banner.created_time || ''}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Space size={4}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleOpenDetailModal(banner.id)}
                            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', padding: '2px 8px', fontSize: 12 }}
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEditModal(banner.id)}
                            style={{ ...modalActionStyle, padding: '2px 8px', fontSize: 12 }}
                          />
                          <Switch
                            checked={banner.status === 0}
                            onChange={() => handleToggleStatus(banner.id, banner.status)}
                            disabled={!!toggleLoading[banner.id]}
                            size="small"
                          />
                          <Button
                            type="primary"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteBanner(banner.id)}
                            style={{ ...deleteButtonStyle, padding: '2px 8px', fontSize: 12 }}
                          />
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center p-3 mt-2">
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Menampilkan {startIndex + 1}–{Math.min(startIndex + pageSize, totalBanners)} dari {totalBanners} banner
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalBanners}
                onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                showSizeChanger
                pageSizeOptions={['10', '20', '50']}
                showQuickJumper
                size="small"
              />
            </div>
          </>
        )}
      </Card>

      {/* Modal for Add/Edit/Detail */}
      <Modal
        title={
          modalMode === 'add'
            ? 'Tambah Banner Baru'
            : modalMode === 'edit'
              ? 'Edit Banner'
              : 'Detail Banner'
        }
        visible={modalVisible}
        onCancel={handleCloseModal}
        width={900}
        footer={renderModalFooter()}
      >
        {modalMode === 'detail' ? (
          renderDetailContent()
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitModal}
            className="mt-4"
          >
            {/* First Row - 2 Columns */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Link"
                name="link"
                rules={[{ required: true, message: 'Link harus diisi' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>

              <Form.Item
                label="Type"
                name="type_web"
                rules={[{ required: true, message: 'Type harus dipilih' }]}
              >
                <Select placeholder="Pilih type">
                  <Option value="web">Web</Option>
                  <Option value="mobile">Mobile</Option>
                  <Option value="email">Email</Option>
                </Select>
              </Form.Item>
            </div>

            {/* Second Row - 2 Columns */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Sort"
                name="sort"
                rules={[{ required: true, message: 'Sort harus diisi' }]}
              >
                <InputNumber min={1} max={999} className="w-full" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Form.Item
                    name="status"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <Form.Item
                    name="is_platform"
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                </div>
              </div>
            </div>

            {/* Image Upload - Full Width */}
            <Form.Item label="Upload Banner" className="mt-4">
              <Upload
                listType="picture-card"
                maxCount={1}
                fileList={fileList}
                onChange={handleOnChange}
                beforeUpload={handleBeforeUpload}
              >
                {fileList.length < 1 && (
                  <div>
                    <UploadOutlined style={{ fontSize: '24px' }} />
                    <div className="mt-2">Pilih Gambar</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default BannerList;

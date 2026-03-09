import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeader } from '@/utils/getAuthHeader';

import { Table, Tag, Typography, Input, Select, message, Drawer, DatePicker, Button, Space, Card, ConfigProvider, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { DeleteOutlined, PlusOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { baseUrl } from '@/configs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const SjInvoiceList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Drawer / create SJ state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null); // store id_company
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tglSj, setTglSj] = useState(null);
  const [keterangan, setKeterangan] = useState('');
  const [creating, setCreating] = useState(false);

  // Button style for "Buat SJ Baru" (single color, no hover)
  const createButtonStyle = {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
    color: '#ffffff',
    boxShadow: 'none',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${baseUrl}/nimda/sj-invoice?page=${currentPage}&limit=${pageSize}`;
      if (searchText) url += `&search=${encodeURIComponent(searchText)}`;

      const authHeader = getAuthHeader();
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });
      if (res.status === 401) {
        // unauthorized - clear storage and redirect to manual login (avoid immediate SSO)
        localStorage.clear();
        navigate('/auth/login');
        return;
      }
      const result = await res.json();

      if (result && result.data) {
        const normalized = result.data.map((item, idx) => {
          const invoiceList = item.sj_invoice_details
            ? item.sj_invoice_details
              .map((d) => d.invoice?.transaction_no)
              .filter(Boolean)
            : [];
          const uniqueInvoices = [...new Set(invoiceList)];

          return {
            key: item.id_sj_invoice,
            no: (currentPage - 1) * pageSize + idx + 1,
            nomor_rekap: item.no_sj || '-',
            invoices: uniqueInvoices,
            company_name: item.company_name || '-',
            tgl_input: item.tgl_sj || item.created_at || '-',
            category: item.keterangan || '-',
            total_items: item.total_items || 0,
            shipped_items: item.shipped_items || 0,
            status: item.status || '-',
            creator: item.username || '-',
            raw: item,
          };
        });

        setTotalData(result.totalData || normalized.length);

        // Filter by status from API (exact match on normalized lower-case)
        const filtered = statusFilter === 'all'
          ? normalized
          : normalized.filter((r) => ((r.status || '').toLowerCase() === statusFilter));

        setData(filtered);
      } else {
        setData([]);
        setTotalData(0);
        message.error('Gagal mengambil data SJ Invoice');
      }
    } catch (err) {
      console.error('Error fetching SJ Invoice:', err);
      message.error('Error saat mengambil data SJ Invoice');
      setData([]);
      setTotalData(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/available-companies`, {
        headers: { Accept: 'application/json', ...(authHeader && { Authorization: authHeader }) },
      });
      const result = await res.json();
      if (result && result.data) setCompanies(result.data);
      else setCompanies([]);
    } catch (err) {
      console.error('Error fetching companies', err);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchAvailableInvoices = async (companyName) => {
    setInvoicesLoading(true);
    try {
      const authHeader = getAuthHeader();
      const url = `${baseUrl}/nimda/sj-invoice/available-invoices?company_name=${encodeURIComponent(companyName)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', ...(authHeader && { Authorization: authHeader }) },
      });
      const result = await res.json();
      if (result && result.data) {
        // normalize invoice objects according to API response
        const normalized = result.data.map((it) => ({
          key: it.id_invoice,
          id_invoice: it.id_invoice,
          transaction_no: it.transaction_no || it.kode || '-',
          transaction_date: it.transaction_date || it.tanggal || it.created_date || null,
          memo: it.memo || '',
          grandtotal: typeof it.grandtotal !== 'undefined' ? it.grandtotal : (it.total || 0),
          payment_status: it.payment_status || it.status || '',
          company_name: it.company_name || it.company?.company_name || '',
          raw: it,
        }));
        setInvoices(normalized);
      } else setInvoices([]);
    } catch (err) {
      console.error('Error fetching invoices', err);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchText]);

  // fetch companies when drawer opens
  useEffect(() => {
    if (drawerVisible) fetchCompanies();
  }, [drawerVisible]);


  const columns = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center',
    },
    {
      title: 'Nomor Rekap',
      dataIndex: 'nomor_rekap',
      key: 'nomor_rekap',
      render: (text, record) => (
        <Link to={`/dashboard/sj-invoice/detail/${record.key}`} style={{ color: '#1890ff', textDecoration: 'underline' }}>
          {text}
        </Link>
      ),
      width: 180,
    },
    {
      title: 'Invoice',
      dataIndex: 'invoices',
      key: 'invoices',
      width: 200,
      render: (invoices) => {
        if (!invoices || invoices.length === 0) return '-';
        if (invoices.length === 1) return <span className="text-xs">{invoices[0]}</span>;

        return (
          <div className="flex items-center gap-1">
            <span className="text-xs">{invoices[0]}</span>
            <Tooltip
              title={
                <div className="flex flex-col gap-1">
                  {invoices.slice(1).map((inv, i) => (
                    <div key={i} className="text-xs">{inv}</div>
                  ))}
                </div>
              }
              color="blue"
            >
              <Tag color="processing" className="m-0 cursor-help text-[10px] px-1 leading-4">
                +{invoices.length - 1}
              </Tag>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: 'Nama Perusahaan',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 220,
    },
    {
      title: 'Tanggal Input',
      dataIndex: 'tgl_input',
      key: 'tgl_input',
      width: 140,
      render: (text) => {
        if (!text) return '-';
        const d = dayjs(text);
        return d.isValid() ? d.format('DD MMM YY') : text;
      },
    },
    {
      title: 'category',
      dataIndex: 'category',
      key: 'category',
      width: 200,
    },
    {
      title: 'Items',
      key: 'items_progress',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <span>{record.shipped_items} / {record.total_items}</span>
      ),
    },
    {
      title: 'status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (text) => {
        const s = (text || '').toLowerCase();
        const tagClass = "rounded-full px-2 py-0.5 font-semibold text-xs border-none inline-block uppercase";

        if (s === 'open') return <Tag className={tagClass} style={{ background: '#ECFDF5', color: '#065F46' }}>{text}</Tag>;
        if (s === 'closed') return <Tag className={tagClass} style={{ background: '#FEF2F2', color: '#991B1B' }}>{text}</Tag>;
        if (s === 'cancel') return <Tag className={tagClass} style={{ background: '#FFFBEB', color: '#B45309' }}>{text}</Tag>;
        if (s === 'new') return <Tag className={tagClass} style={{ background: '#E0F2FE', color: '#075985' }}>{text}</Tag>;

        // fallback patterns
        if (s.includes('pending')) return <Tag className={tagClass} style={{ background: '#FFFBEB', color: '#B45309' }}>{text}</Tag>;
        if (s.includes('dikirim') || s.includes('kirim')) return <Tag className={tagClass} style={{ background: '#ECFEFF', color: '#0E7490' }}>{text}</Tag>;
        if (s.includes('diterima') || s.includes('received')) return <Tag className={tagClass} style={{ background: '#ECFDF5', color: '#065F46' }}>{text}</Tag>;
        if (s.includes('rejected') || s.includes('failed')) return <Tag className={tagClass} style={{ background: '#FEF2F2', color: '#991B1B' }}>{text}</Tag>;

        return <Tag className={tagClass} style={{ background: '#F3F4F6', color: '#374151' }}>{text}</Tag>;
      },
    },
    // {
    //   title: 'Aksi',
    //   dataIndex: 'creator',
    //   key: 'aksi',
    //   width: 140,
    //   render: (text, record) => (
    //     <div className="flex items-center gap-2">
    //       <span className="text-sm">{text}</span>
    //     </div>
    //   ),
    // },
  ];

  const invoiceColumns = [
    {
      title: 'No.',
      dataIndex: 'key',
      key: 'no',
      width: 60,
      render: (_, __, idx) => idx + 1,
    },
    {
      title: 'Nomor Invoice',
      dataIndex: 'transaction_no',
      key: 'transaction_no',
      render: (text) => <span className="text-sm text-blue-600">{text}</span>,
    },
    {
      title: 'Tanggal',
      dataIndex: 'transaction_date',
      key: 'transaction_date',
      render: (text) => (text ? dayjs(text).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Total',
      dataIndex: 'grandtotal',
      key: 'grandtotal',
      align: 'right',
      render: (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v || 0),
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      align: 'center',
      render: (s) => <Tag color={s && s.toLowerCase().includes('open') ? 'orange' : 'green'}>{s}</Tag>,
    },
  ];

  return (
    <ConfigProvider theme={{ token: { fontFamily: 'Plus Jakarta Sans' } }}>
      <div className="mb-8 px-2 sm:px-0" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <Card className="shadow-sm">
          <div className="p-3 m-0 text-left">
            <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
              Daftar SJ Invoice
            </Title>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Search
                  placeholder="Cari SJ..."
                  onSearch={(val) => { setSearchText(val); setCurrentPage(1); }}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 240 }}
                  allowClear
                />
                <Select value={statusFilter} onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }} style={{ width: 160 }}>
                  <Option value="all">Semua Status</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="diterima">Diterima</Option>
                  <Option value="other">Lainnya</Option>
                </Select>
              </div>
              <Button
                type="primary"
                onClick={() => setDrawerVisible(true)}
                style={createButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
                className="w-full sm:w-auto"
              >
                + Buat SJ Baru
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={{
                current: currentPage,
                pageSize,
                total: totalData,
                showSizeChanger: false,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} item`,
              }}
              onChange={(pagination) => setCurrentPage(pagination.current)}
              rowKey="key"
              size="small"
              className="ant-table-custom"
            />

            {/* Drawer to create SJ */}
            <Drawer
              title="Buat SJ Baru"
              placement="right"
              width={800}
              onClose={() => setDrawerVisible(false)}
              open={drawerVisible}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <label className="block text-sm font-medium mb-2">Pilih Perusahaan</label>
                  <Select
                    showSearch
                    value={selectedCompany}
                    onChange={(val) => {
                      setSelectedCompany(val);
                      setSelectedRowKeys([]);
                      setSelectedInvoiceIds([]);
                      const comp = companies.find((x) => x.id_company === val);
                      if (comp) fetchAvailableInvoices(comp.company_name);
                    }}
                    placeholder="Cari dan pilih perusahaan"
                    style={{ width: '100%' }}
                    loading={companiesLoading}
                    optionFilterProp="children"
                  >
                    {companies.map((c) => (
                      <Option key={c.id_company} value={c.id_company}>{c.company_name}</Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Daftar Invoice</div>
                    <div className="text-sm text-gray-500">Dipilih: {selectedInvoiceIds.length}</div>
                  </div>
                  <Table
                    columns={invoiceColumns}
                    dataSource={invoices}
                    loading={invoicesLoading}
                    pagination={{ pageSize: 10 }}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (keys, rows) => {
                        setSelectedRowKeys(keys);
                        setSelectedInvoiceIds(keys);
                      },
                    }}
                    rowKey="key"
                    size="small"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tanggal SJ</label>
                  <DatePicker value={tglSj} onChange={(d) => setTglSj(d)} style={{ width: 240 }} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Keterangan</label>
                  <Input.TextArea rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Pastikan invoice yang dipilih benar.</div>
                  <div>
                    <Button style={{ marginRight: 8 }} onClick={() => setDrawerVisible(false)}>Batal</Button>
                    <Button
                      type="primary"
                      disabled={!selectedInvoiceIds.length || !tglSj || creating}
                      loading={creating}
                      style={createButtonStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007BFF')}
                      onClick={async () => {
                        if (!selectedInvoiceIds.length) return message.error('Pilih minimal 1 invoice');
                        if (!tglSj) return message.error('Pilih tanggal SJ');

                        if (selectedCompany) {
                          const selectedRows = invoices.filter((it) => selectedInvoiceIds.includes(it.id_invoice));
                          const invalid = selectedRows.some((r) => {
                            const ic = r.raw?.id_company || r.raw?.company_id;
                            return ic !== selectedCompany;
                          });
                          if (invalid) {
                            return message.error('Semua invoice yang dipilih harus berasal dari perusahaan yang sama. Silakan pilih ulang.');
                          }
                        }

                        setCreating(true);
                        try {
                          const authHeader = getAuthHeader();
                          const payload = {
                            tgl_sj: dayjs(tglSj).format('YYYY-MM-DD'),
                            invoice_ids: selectedInvoiceIds,
                            keterangan: keterangan || '',
                          };
                          const res = await fetch(`${baseUrl}/nimda/sj-invoice`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(authHeader && { Authorization: authHeader }),
                            },
                            body: JSON.stringify(payload),
                          });
                          const result = await res.json();
                          if (res.ok && result.success) {
                            message.success('SJ berhasil dibuat');
                            setDrawerVisible(false);
                            setSelectedCompany(null);
                            setInvoices([]);
                            setSelectedInvoiceIds([]);
                            setSelectedRowKeys([]);
                            setTglSj(null);
                            setKeterangan('');
                            fetchData();
                          } else {
                            message.error(result.message || 'Gagal membuat SJ');
                          }
                        } catch (err) {
                          console.error('Error creating SJ', err);
                          message.error('Error saat membuat SJ');
                        } finally {
                          setCreating(false);
                        }
                      }}
                    >
                      Buat SJ ({selectedInvoiceIds.length})
                    </Button>
                  </div>
                </div>
              </Space>
            </Drawer>

            <style jsx>{`
              .ant-table-custom .ant-table-thead > tr > th {
                background-color: #f9fafb;
                color: #374151;
                font-weight: 600;
                padding: 12px 8px;
                border-bottom: 2px solid #e5e7eb;
                font-size: 12px;
              }
              .ant-table-custom .ant-table-tbody > tr > td {
                padding: 12px 8px;
                color: #4b5563;
                font-size: 12px;
              }
            `}</style>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default SjInvoiceList;

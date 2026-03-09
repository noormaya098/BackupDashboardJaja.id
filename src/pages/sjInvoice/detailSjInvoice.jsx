import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAuthHeader } from '@/utils/getAuthHeader';
import { Card, CardBody, Button } from '@material-tailwind/react';
import { Typography, Table, Tag, message, Modal, Form, Input, DatePicker, Checkbox, Select, Upload } from 'antd';
import { FileTextOutlined, CheckOutlined, CloseOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import { baseUrl } from '@/configs';

const { Title } = Typography;

const DetailSjInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedSendRowKeys, setSelectedSendRowKeys] = useState([]);
  const [sendForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/${id}`, {
        headers: {
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/auth/login');
        return;
      }
      const result = await res.json();
      if (result && result.data) {
        setDetail(result.data);
        // prepare table data with sequential numbering
        const details = (result.data.sj_invoice_details || []).map((item, idx) => ({
          ...item,
          key: item.id_sj_invoice_detail,
          no: idx + 1,
        }));
        setTableData(details);
      } else {
        message.error('Gagal mengambil detail SJ Invoice');
      }
    } catch (err) {
      console.error('Error fetching SJ Invoice detail:', err);
      message.error('Error saat mengambil detail SJ Invoice');
    } finally {
      setLoading(false);
    }
  };

  const openSendModal = (record = null) => {
    if (record && record.id_sj_invoice_detail) {
      setSelectedSendRowKeys([record.id_sj_invoice_detail]);
    } else {
      // only show and preselect rows that haven't been sent and haven't been received
      const pendingItems = tableData.filter(item => !item.tgl_kirim && !item.tgl_terima);
      const keys = pendingItems.map((r) => r.id_sj_invoice_detail);
      setSelectedSendRowKeys(keys);
    }
    // prepare send form defaults
    sendForm.setFieldsValue({
      tgl_kirim: dayjs(),
      kategori: 'Direct',
      kurir: undefined,
      waybill: '',
    });
    setSendModalVisible(true);
  };

  const handleSend = async () => {
    try {
      const values = await sendForm.validateFields();
      const payload = {
        tgl_kirim: values.tgl_kirim ? dayjs(values.tgl_kirim).format('YYYY-MM-DD') : null,
        invoice_ids: selectedSendRowKeys.map((key) => {
          const item = tableData.find((t) => t.id_sj_invoice_detail === key);
          return item?.invoice?.id_invoice || item?.id_invoice || null;
        }).filter(Boolean),
      };

      if (!payload.invoice_ids.length) {
        return message.error('Pilih minimal 1 invoice untuk proses Kirim');
      }

      setLoading(true);
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/${id}/ship`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/auth/login');
        return;
      }
      const result = await res.json();
      if (res.ok && (result.success || result.data)) {
        message.success(result.message || 'SJ berhasil dikirim');
        setSendModalVisible(false);
        fetchDetail();
      } else {
        message.error(result.message || 'Gagal mengirim SJ');
      }
    } catch (err) {
      console.error('Error sending SJ:', err);
      message.error('Error saat proses Kirim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // helper to remove a row client-side and reindex 'no'
  const handleRemoveRow = (rowId) => {
    const filtered = tableData.filter((r) => r.id_sj_invoice_detail !== rowId);
    const reindexed = filtered.map((item, idx) => ({ ...item, no: idx + 1 }));
    setTableData(reindexed);
  };

  const [rowLampiran, setRowLampiran] = useState({});

  const handleRowLampiranChange = (recordId, field, value) => {
    setRowLampiran(prev => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || { keterangan: '', file: null }),
        [field]: value
      }
    }));
  };

  const openReceiveModal = (record = null) => {
    // If a record is passed, we are receiving specifically that invoice
    if (record && record.id_sj_invoice_detail) {
      setSelectedRowKeys([record.id_sj_invoice_detail]);
    } else {
      // preselect all items that have been sent but haven't been received
      const pendingReceive = tableData.filter(r => r.tgl_kirim && !r.tgl_terima);
      const keys = pendingReceive.map((r) => r.id_sj_invoice_detail);
      setSelectedRowKeys(keys);
    }

    setRowLampiran({}); // Reset per-row lampiran on open
    form.setFieldsValue({
      penerima: detail.penerima || '',
      jabatan: '',
      tgl_terima: detail.tgl_terima ? dayjs(detail.tgl_terima) : dayjs()
    });
    setModalVisible(true);
  };

  const handleReceive = async () => {
    try {
      const values = await form.validateFields();

      const invoiceIds = selectedRowKeys.map((key) => {
        const item = tableData.find((t) => t.id_sj_invoice_detail === key);
        return item?.invoice?.id_invoice || item?.id_invoice || null;
      }).filter(Boolean);

      if (!invoiceIds.length) {
        return message.error('Pilih minimal 1 invoice untuk proses Terima');
      }

      setLoading(true);
      const authHeader = getAuthHeader();

      // Process each selected invoice individually to support per-row files
      for (const key of selectedRowKeys) {
        const item = tableData.find((t) => t.id_sj_invoice_detail === key);
        if (!item) continue;

        const invId = item?.invoice?.id_invoice || item?.id_invoice;
        if (!invId) continue;

        const rowData = rowLampiran[key] || {};

        let data = new FormData();
        data.append('id_invoice', invId);
        data.append('penerima', values.penerima);
        data.append('jabatan_penerima', values.jabatan || '');
        data.append('tgl_terima', values.tgl_terima ? dayjs(values.tgl_terima).format('YYYY-MM-DD') : '');
        data.append('keterangan_lampiran', rowData.keterangan || '');

        if (rowData.file) {
          data.append('files', rowData.file);
        }

        let config = {
          method: 'put',
          maxBodyLength: Infinity,
          url: `${baseUrl}/nimda/sj-invoice/${id}/receive`,
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          },
          data: data
        };

        const response = await axios.request(config);

        if (response.status === 401) {
          localStorage.clear();
          navigate('/auth/login');
          return;
        }
      }

      message.success('SJ berhasil diterima');
      setModalVisible(false);
      fetchDetail();
    } catch (err) {
      console.error('Error receiving SJ:', err);
      message.error('Error saat proses Terima');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/auth/login');
        return;
      }
      const result = await res.json();
      if (result && result.success) {
        message.success(result.message || 'Status berhasil diupdate');
        fetchDetail();
      } else {
        message.error(result.message || 'Gagal update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      message.error('Error saat update status');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    // Populate form with current detail data
    const initialItems = (detail.sj_invoice_details || []).map(d => ({
      id_invoice: d.id_invoice,
      transaction_no: d.invoice?.transaction_no,
      penerima: d.penerima || '',
      jabatan_penerima: d.jabatan_penerima || '',
      tgl_terima: d.tgl_terima ? dayjs(d.tgl_terima) : null,
    }));

    editForm.setFieldsValue({
      tgl_kirim: detail.tgl_kirim ? dayjs(detail.tgl_kirim) : null,
      items: initialItems,
    });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = {
        tgl_kirim: values.tgl_kirim ? dayjs(values.tgl_kirim).format('YYYY-MM-DD') : null,
        items: values.items.map(it => ({
          id_invoice: it.id_invoice,
          penerima: it.penerima,
          jabatan_penerima: it.jabatan_penerima,
          tgl_terima: it.tgl_terima ? dayjs(it.tgl_terima).format('YYYY-MM-DD') : null,
        })),
      };

      setLoading(true);
      const authHeader = getAuthHeader();
      const res = await fetch(`${baseUrl}/nimda/sj-invoice/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.clear();
        navigate('/auth/login');
        return;
      }

      const result = await res.json();
      if (res.ok && result.success) {
        message.success(result.message || 'SJ berhasil diperbarui');
        setEditModalVisible(false);
        fetchDetail();
      } else {
        message.error(result.message || 'Gagal memperbarui SJ');
      }
    } catch (err) {
      console.error('Error updating SJ:', err);
      message.error('Error saat memperbarui SJ');
    } finally {
      setLoading(false);
    }
  };

  if (!detail) {
    return (
      <div className="mb-8 px-2 sm:px-0">
        <Card>
          <CardBody>
            <Title level={4}>Loading...</Title>
          </CardBody>
        </Card>
      </div>
    );
  }

  const headerRows = [
    { label: 'Nomor Rekap', value: detail.no_sj },
    // { label: 'Penerima', value: detail.penerima || '-' },
    { label: 'Customer', value: detail.sj_invoice_details?.[0]?.invoice?.company_name || '-' },
    { label: 'Category', value: detail.keterangan || '-' },
    { label: 'Kurir', value: detail.sj_invoice_details?.[0]?.invoice?.ship_via || '-' },
    // { label: 'Waybill', value: detail.sj_invoice_details?.[0]?.invoice?.tracking_no || '-' },
    { label: 'Tanggal Input', value: detail.created_at ? dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss') : '-' },
    // { label: 'Nama Lengkap', value: detail.creator?.nama_user || '-' },
    { label: 'Catatan', value: detail.keterangan || '-' },
  ];

  const headerCell = (text) => (
    <div className="whitespace-nowrap font-semibold text-gray-700">{text}</div>
  );

  const columns = [
    { title: headerCell('No.'), dataIndex: 'no', key: 'no', width: 60, align: 'center', render: (_, record) => record.no },
    {
      title: headerCell('No Invoice'), dataIndex: ['invoice', 'transaction_no'], key: 'transaction_no', width: 180, render: (_, record) => (
        <span className="whitespace-nowrap text-gray-800">{record.invoice?.transaction_no || '-'}</span>
      )
    },
    {
      title: headerCell('Nomor SO'), dataIndex: ['invoice', 'delivery_order', 'transaksi', 'order_id'], key: 'order_id', width: 180, render: (_, record) => (
        <span className="whitespace-nowrap transition-all hover:text-blue-600">
          {record.invoice?.delivery_order?.transaksi?.order_id || '-'}
        </span>
      )
    },
    {
      title: headerCell('Produk'), key: 'products', width: 300, render: (_, record) => {
        const details = record.invoice?.invoice_details || [];
        if (details.length === 0) return '-';
        return (
          <div className="flex flex-col gap-1 py-1">
            {details.map((p, i) => (
              <div key={i} className="flex flex-col border-b border-gray-100 last:border-0 pb-1">
                <span className="text-xs font-semibold text-gray-800 leading-tight">{p.product_name}</span>
                <span className="text-[10px] text-gray-500">Qty: {p.quantity}</span>
              </div>
            ))}
          </div>
        );
      }
    },
    { title: headerCell('Customer'), dataIndex: ['invoice', 'company_name'], key: 'company_name' },
    { title: headerCell('Tgl Invoice'), dataIndex: ['invoice', 'transaction_date'], key: 'transaction_date', render: (text) => <strong>{dayjs(text).format('DD MMM YYYY')}</strong> },
    { title: headerCell('Jenis'), dataIndex: ['invoice', 'payment_status'], key: 'payment_status', render: (_, record) => 'ar' },
    { title: headerCell('Memo'), dataIndex: ['invoice', 'memo'], key: 'memo', render: (text) => text || '' },
    { title: headerCell('Penerima'), dataIndex: 'penerima', key: 'penerima', render: (text) => text || '-' },
    { title: headerCell('Jabatan'), dataIndex: 'jabatan_penerima', key: 'jabatan_penerima', render: (text) => text || '-' },
    {
      title: headerCell('Tgl Kirim'), dataIndex: 'tgl_kirim', key: 'tgl_kirim', render: (text, record) => {
        if (text) return <span className="whitespace-nowrap">{dayjs(text).format('DD MMM YYYY')}</span>;
        if (!record.tgl_terima) {
          return (
            <Button
              size="small"
              className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm flex items-center h-7 text-[11px]"
              onClick={() => openSendModal(record)}
            >
              <SendOutlined className="mr-1" style={{ fontSize: '10px' }} /> Kirim
            </Button>
          );
        }
        return '-';
      }
    },
    {
      title: headerCell('Tgl Terima'), dataIndex: 'tgl_terima', key: 'tgl_terima', render: (text, record) => {
        if (text) return <span className="whitespace-nowrap" style={{ color: '#47df63ff', fontWeight: 700 }}>{dayjs(text).format('DD MMM YYYY')}</span>;
        if (record.tgl_kirim) {
          return (
            <Button
              size="small"
              className="bg-green-500 hover:bg-green-600 text-white border-none shadow-sm flex items-center h-7 text-[11px]"
              onClick={() => openReceiveModal(record)}
            >
              <CheckOutlined className="mr-1" style={{ fontSize: '10px' }} /> Terima
            </Button>
          );
        }
        return '-';
      }
    },
    {
      title: headerCell('Lampiran'), key: 'lampiran', width: 200, render: (_, record) => {
        const lampiranList = record.invoice?.lampiran || [];
        if (lampiranList.length === 0) return '-';

        return (
          <div className="flex flex-col gap-1 py-1">
            {lampiranList.map((file, idx) => (
              <a
                key={idx}
                href={`${baseUrl}/lampiran_sj/${file.file_lampiran}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 text-[11px] flex items-center gap-1"
              >
                <UploadOutlined style={{ fontSize: '10px' }} />
                <span className="truncate max-w-[150px]" title={file.nama_lampiran}>
                  {file.nama_lampiran}
                </span>
              </a>
            ))}
          </div>
        );
      }
    },
  ];

  const statusLower = (detail.status || '').toLowerCase();

  return (
    <div className="mb-8 px-2 sm:px-0">
      <Card>
        <div className="mt-5 p-3 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col">
              <Title level={4} className="m-0 p-0 text-left flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <FileTextOutlined style={{ fontSize: '24px', marginRight: '12px', color: '#1890ff' }} />
                Rekap Detail
              </Title>
              <div className="mt-1 ml-9">
                {/* map status to subtle background + pill */}
                {(() => {
                  const s = statusLower;
                  const tagClass = "rounded-full px-2 py-0.5 font-semibold text-xs border-none inline-block uppercase";
                  if (s === 'open') return <Tag className={tagClass} style={{ background: '#ECFDF5', color: '#065F46' }}>{detail.status}</Tag>;
                  if (s === 'closed') return <Tag className={tagClass} style={{ background: '#FEF2F2', color: '#991B1B' }}>{detail.status}</Tag>;
                  if (s === 'cancel') return <Tag className={tagClass} style={{ background: '#FFFBEB', color: '#B45309' }}>{detail.status}</Tag>;
                  if (s === 'new') return <Tag className={tagClass} style={{ background: '#E0F2FE', color: '#075985' }}>{detail.status}</Tag>;

                  // fallback patterns
                  if (s.includes('pending')) return <Tag className={tagClass} style={{ background: '#FFFBEB', color: '#B45309' }}>{detail.status}</Tag>;
                  if (s.includes('dikirim') || s.includes('kirim')) return <Tag className={tagClass} style={{ background: '#ECFEFF', color: '#0E7490' }}>{detail.status}</Tag>;
                  if (s.includes('diterima') || s.includes('received')) return <Tag className={tagClass} style={{ background: '#ECFDF5', color: '#065F46' }}>{detail.status}</Tag>;
                  if (s.includes('rejected') || s.includes('failed')) return <Tag className={tagClass} style={{ background: '#FEF2F2', color: '#991B1B' }}>{detail.status}</Tag>;
                  return <Tag className={tagClass} style={{ background: '#F3F4F6', color: '#374151' }}>{detail.status}</Tag>;
                })()}
              </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={() => window.open(`/sj-invoice/print/${detail.id_sj_invoice}`, '_blank')}
                style={{ backgroundColor: '#3b82f6' }}
                className="px-3 py-1.5 rounded-md font-semibold text-sm text-white shadow-sm hover:brightness-95 border-none cursor-pointer transition-all"
              >
                Print SJ
              </button>



              {tableData.some(item => !item.tgl_kirim && !item.tgl_terima) && (
                <button
                  onClick={() => openSendModal()}
                  style={{ backgroundColor: '#f17f63ff' }}
                  className="px-3 py-1.5 text-white rounded-md font-semibold text-sm shadow-sm transition-all border-none hover:brightness-95 cursor-pointer"
                >
                  <SendOutlined className="mr-1" /> Kirim Semua
                </button>
              )}

              <button onClick={openEditModal} className="px-3 py-1.5 rounded-md font-semibold text-sm text-white bg-amber-500 shadow-sm hover:brightness-95 border-none cursor-pointer transition-all">Edit Detail</button>
              <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-md font-semibold text-sm text-white bg-red-500 shadow-sm hover:brightness-95 border-none cursor-pointer transition-all">Kembali</button>
            </div>
          </div>

        </div>

        <CardBody>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {headerRows.map((r) => (
                <div key={r.label}>
                  <div className="text-sm font-medium text-gray-600">{r.label}</div>
                  <div className="mt-1 p-1 bg-gray-100 rounded text-sm">{r.value || '-'}</div>
                </div>
              ))}
            </div>

            <div>
              <Table
                className='overflow-auto'
                columns={columns}
                dataSource={tableData}
                pagination={false}
                rowKey={(record) => record.id_sj_invoice_detail}
              />
            </div>
          </div>
        </CardBody>
      </Card>
      <Modal
        title="Terima SJ Invoice"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleReceive}
        okButtonProps={{ className: 'sj-modal-ok-blue bg-blue-500', loading: loading }}
        okText="Simpan"
        cancelText="Batal"
        width={1100}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Form.Item label="Nama Penerima" name="penerima" rules={[{ required: true, message: 'Nama penerima wajib diisi' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Jabatan Penerima" name="jabatan">
              <Input />
            </Form.Item>
            <Form.Item label="Tgl Diterima" name="tgl_terima" rules={[{ required: true, message: 'Tanggal diterima wajib diisi' }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <div className="mt-4">
            <Table
              columns={[
                { title: 'No.', dataIndex: 'no', key: 'no', width: 50, render: (_, r, idx) => idx + 1 },
                {
                  title: '',
                  dataIndex: 'check',
                  key: 'check',
                  width: 50,
                  render: (_, r) => (
                    <Checkbox
                      checked={selectedRowKeys.includes(r.id_sj_invoice_detail)}
                      disabled={!selectedRowKeys.includes(r.id_sj_invoice_detail)}
                    />
                  )
                },
                { title: 'No Invoice', dataIndex: ['invoice', 'transaction_no'], key: 'transaction_no', width: 140 },
                { title: 'Customer', dataIndex: ['invoice', 'company_name'], key: 'company_name', width: 180 },
                { title: 'Tgl Invoice', dataIndex: ['invoice', 'transaction_date'], key: 'transaction_date', width: 110, render: (text) => dayjs(text).format('DD MMM YYYY') },
                {
                  title: 'Keterangan',
                  key: 'keterangan',
                  width: 200,
                  render: (_, r) => (
                    <Input
                      placeholder="Ket. Lampiran"
                      value={rowLampiran[r.id_sj_invoice_detail]?.keterangan || ''}
                      onChange={(e) => handleRowLampiranChange(r.id_sj_invoice_detail, 'keterangan', e.target.value)}
                    />
                  )
                },
                {
                  title: 'Upload Lampiran',
                  key: 'upload',
                  width: 250,
                  render: (_, r) => (
                    <Upload
                      beforeUpload={(file) => {
                        handleRowLampiranChange(r.id_sj_invoice_detail, 'file', file);
                        return false;
                      }}
                      fileList={rowLampiran[r.id_sj_invoice_detail]?.file ? [{
                        uid: '-1',
                        name: rowLampiran[r.id_sj_invoice_detail].file.name,
                        status: 'done',
                      }] : []}
                      onRemove={() => handleRowLampiranChange(r.id_sj_invoice_detail, 'file', null)}
                      maxCount={1}
                    >
                      <Button icon={<UploadOutlined />} size="small">Pilih File</Button>
                    </Upload>
                  )
                },
              ]}
              dataSource={tableData.filter(r => selectedRowKeys.includes(r.id_sj_invoice_detail))}
              pagination={false}
              rowKey={(record) => record.id_sj_invoice_detail}
              size='small'
            />
          </div>
        </Form>
      </Modal>

      <Modal
        title="Edit SJ Detail"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSave}
        okText="Simpan Perubahan"
        okButtonProps={{ className: 'sj-modal-ok-blue' }}
        cancelText="Batal"
        width={1000}
      >
        <Form form={editForm} layout="vertical">
          <div className="mb-4">
            <Form.Item label="Tanggal Kirim Keseluruhan" name="tgl_kirim">
              <DatePicker className="w-full" style={{ maxWidth: 240 }} format={'DD/MM/YYYY'} />
            </Form.Item>
          </div>

          <Form.List name="items">
            {(fields) => (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 border text-left text-xs font-semibold">No Invoice</th>
                      <th className="p-2 border text-left text-xs font-semibold">Penerima</th>
                      <th className="p-2 border text-left text-xs font-semibold">Jabatan</th>
                      <th className="p-2 border text-left text-xs font-semibold">Tgl Terima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(({ key, name, ...restField }) => (
                      <tr key={key}>
                        <td className="p-2 border">
                          <Form.Item
                            {...restField}
                            name={[name, 'transaction_no']}
                            noStyle
                          >
                            <Input variant="borderless" readOnly />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'id_invoice']}
                            noStyle
                            hidden
                          >
                            <Input />
                          </Form.Item>
                        </td>
                        <td className="p-2 border">
                          <Form.Item
                            {...restField}
                            name={[name, 'penerima']}
                            noStyle
                          >
                            <Input placeholder="Nama Penerima" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border">
                          <Form.Item
                            {...restField}
                            name={[name, 'jabatan_penerima']}
                            noStyle
                          >
                            <Input placeholder="Jabatan" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border">
                          <Form.Item
                            {...restField}
                            name={[name, 'tgl_terima']}
                            noStyle
                          >
                            <DatePicker style={{ width: '100%' }} format={'DD/MM/YYYY'} />
                          </Form.Item>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Kirim SJ Invoice"
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        onOk={handleSend}
        okText="Kirim"

        okButtonProps={{
          className: 'sj-modal-ok-blue bg-blue-500',
          loading: loading
        }}
        cancelText="Batal"
        width={900}
      >
        <Form form={sendForm} layout="vertical">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Tgl Kirim" name="tgl_kirim" rules={[{ required: true, message: 'Tanggal kirim wajib diisi' }]}>
              <DatePicker className="w-full" format={'DD/MM/YYYY'} />
            </Form.Item>
            {/* <Form.Item label="Kategori" name="kategori" rules={[{ required: true, message: 'Kategori wajib dipilih' }]}>
              <Select>
                <Select.Option value="Direct">Direct</Select.Option>
                <Select.Option value="Kurir">Kurir</Select.Option>
              </Select>
            </Form.Item> */}
            {/* <Form.Item noStyle shouldUpdate={(prev, cur) => prev.kategori !== cur.kategori}>
              {() => (
                sendForm.getFieldValue('kategori') === 'Kurir' ? (
                  <Form.Item label="Kurir" name="kurir" rules={[{ required: true, message: 'Pilih kurir' }]}>
                    <Select>
                      <Select.Option value="Dikirim sendiri">Dikirim sendiri</Select.Option>
                      <Select.Option value="Raja Cepat">Raja Cepat</Select.Option>
                      <Select.Option value="Lion Parcel">Lion Parcel</Select.Option>
                      <Select.Option value="JNE">JNE</Select.Option>
                    </Select>
                  </Form.Item>
                ) : (
                  <Form.Item label="Kurir" name="kurir">
                    <Input placeholder="(Tidak perlu untuk Direct)" />
                  </Form.Item>
                )
              )}
            </Form.Item>
            <Form.Item label="Waybill" name="waybill">
              <Input />
            </Form.Item> */}
          </div>

          <div className="mt-4">
            <Table
              columns={[
                { title: 'No.', dataIndex: 'no', key: 'no', width: 60, render: (_, r, idx) => idx + 1 },
                {
                  title: (
                    <Checkbox
                      checked={selectedSendRowKeys.length === tableData.filter(item => !item.tgl_kirim && !item.tgl_terima).length && tableData.filter(item => !item.tgl_kirim && !item.tgl_terima).length > 0}
                      indeterminate={selectedSendRowKeys.length > 0 && selectedSendRowKeys.length < tableData.filter(item => !item.tgl_kirim && !item.tgl_terima).length}
                      onChange={(e) => {
                        const pendingItems = tableData.filter(item => !item.tgl_kirim && !item.tgl_terima);
                        if (e.target.checked) setSelectedSendRowKeys(pendingItems.map(r => r.id_sj_invoice_detail));
                        else setSelectedSendRowKeys([]);
                      }}
                    />
                  ),
                  dataIndex: 'check',
                  key: 'check',
                  width: 60,
                  render: (_, r) => (
                    <Checkbox checked={selectedSendRowKeys.includes(r.id_sj_invoice_detail)} onChange={(e) => {
                      if (e.target.checked) setSelectedSendRowKeys((s) => Array.from(new Set([...s, r.id_sj_invoice_detail])));
                      else setSelectedSendRowKeys((s) => s.filter((k) => k !== r.id_sj_invoice_detail));
                    }} />
                  )
                },
                { title: 'No Invoice', dataIndex: ['invoice', 'transaction_no'], key: 'transaction_no' },
                { title: 'Customer', dataIndex: ['invoice', 'company_name'], key: 'company_name' },
                { title: 'Tgl Invoice', dataIndex: ['invoice', 'transaction_date'], key: 'transaction_date', render: (text) => dayjs(text).format('DD MMM YYYY') },
                { title: 'Memo', dataIndex: ['invoice', 'memo'], key: 'memo', render: (t) => t || '' },
              ]}
              dataSource={tableData.filter(item => !item.tgl_kirim && !item.tgl_terima)}
              pagination={false}
              rowKey={(record) => record.id_sj_invoice_detail}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DetailSjInvoice;

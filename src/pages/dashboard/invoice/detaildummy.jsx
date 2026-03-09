import React, { useState, useEffect } from 'react';
import { 
  Button, 
  DatePicker, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Tooltip, 
  Form,
  InputNumber,
  Typography,
  Row,
  Col,
  Card,
  Divider,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExportOutlined,
  UserOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const DetailDummy = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({});
  const [products, setProducts] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm] = Form.useForm();
  const [isEditMode, setIsEditMode] = useState(false);

  // Fungsi untuk fetch data dari API
  const fetchInvoiceData = async (id_data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://apidev.jaja.id/nimda/invoice/detail-invoice/${id_data}`, {
        headers: {
          Authorization: `${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.code === 200) {
        const data = result.data;

        setInvoiceData({
          invoiceNumber: data.invoice,
          mdNumber: data.order_id,
          status: data.status_transaksi,
          paymentStatus: data.metode_pembayaran ? 'PAID' : 'NON DEPOSIT',
          salesInfo: data.id_sales || 'N/A',
          businessType: 'B2C',
          customerType: 'Personal',
          customerFirstName: data.nama_customer.split(' ')[0],
          customerLastName: data.nama_customer.split(' ').slice(1).join(' ') || '',
          pengiriman: data.pengiriman,
          phoneNumber: data.telp_penerima,
          transactionDate: moment(data.created_date),
          paymentTerms: `Top ${moment(data.batas_pembayaran).diff(moment(data.created_date), 'days')}`,
          dueDate: moment(data.batas_pembayaran),
          customerAddress: data.alamat_pengiriman,
          note: data.pesan_customer || '',
          subtotal: data.subtotal,
          tax: data.tax_amount,
          grandTotal: data.total_tagihan,
          remainingPayment: data.total_pembayaran - (data.subtotal || 0),
          insurance: data.biaya_asuransi,
          discount: data.diskon_voucher || data.diskon_voucher_toko || 0,
          point: data.koin,
        });

        const mappedProducts = data.details.map((detail, index) => ({
          key: detail.id_detail,
          no: index + 1,
          product: detail.nama_produk,
          description: detail.deskripsi,
          qty: parseInt(detail.qty),
          unit: 'Item',
          price: parseInt(detail.harga_aktif),
          discount: 0,
          tax: 'N/A',
          amount: parseInt(detail.total),
        }));
        setProducts(mappedProducts);
      } else {
        console.error('Gagal mengambil data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id_data = 9315;
    fetchInvoiceData(id_data);
  }, []);

  const calculateAmount = (values) => {
    const qty = values.qty || 0;
    const price = values.price || 0;
    const discount = values.discount || 0;
    const tax = parseFloat(values.tax) || 0; // Asumsi tax dalam persen
    
    const subtotal = qty * price;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal - discount + taxAmount;
    
    return total;
  };

  const handleAddItem = () => {
    setIsEditMode(false);
    setSelectedProduct(null);
    editForm.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setIsEditMode(true);
    setSelectedProduct(record);
    editForm.setFieldsValue({
      product: record.product,
      amount: record.amount,
      discount: record.discount,
      qty: record.qty,
      price: record.price,
      tax: record.tax,
      description: record.description
    });
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    editForm.validateFields().then(values => {
      const amount = calculateAmount(values);
      const newData = {
        ...values,
        amount: amount,
        unit: 'Item',
        key: isEditMode && selectedProduct ? selectedProduct.key : Date.now(),
        no: isEditMode && selectedProduct ? selectedProduct.no : products.length + 1
      };

      if (isEditMode && selectedProduct) {
        const updatedProducts = products.map(item => 
          item.key === selectedProduct.key ? newData : item
        );
        setProducts(updatedProducts);
      } else {
        setProducts([...products, newData]);
      }
      
      setIsModalVisible(false);
    });
  };

  const productColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 50 },
    { title: 'Produk', dataIndex: 'product', key: 'product', width: 150 },
    { title: 'Deskripsi', dataIndex: 'description', key: 'description', width: 350 },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 70, align: 'center' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    { 
      title: 'Harga', 
      dataIndex: 'price', 
      key: 'price',
      width: 120,
      render: (price) => price.toLocaleString()
    },
    { 
      title: 'Diskon', 
      dataIndex: 'discount', 
      key: 'discount',
      width: 100,
      render: (discount) => discount.toLocaleString()
    },
    { title: 'Pajak', dataIndex: 'tax', key: 'tax', width: 100 },
    { 
      title: 'Jumlah', 
      dataIndex: 'amount', 
      key: 'amount',
      width: 120,
      render: (amount) => amount.toLocaleString()
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="hover:bg-blue-600 hover:text-white transition-colors"
          />
          <Button 
            size="small" 
            icon={<DeleteOutlined />}
            className="bg-red-500 text-white hover:bg-red-600 transition-colors"
          />
        </div>
      ),
    },
  ];

  const paymentHistoryColumns = [
    { title: 'No', dataIndex: 'no', key: 'no', width: 70 },
    { title: '#', dataIndex: 'number', key: 'number', width: 70 },
    { title: 'Deposit to', dataIndex: 'depositTo', key: 'depositTo', width: 150 },
    { title: 'Payment Method', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 150 },
    { 
      title: 'Total', 
      dataIndex: 'total', 
      key: 'total',
      width: 150,
      render: (total) => total ? total.toLocaleString() : '0'
    },
    { title: 'Note', dataIndex: 'note', key: 'note', width: 200 },
    { title: 'Date Receive', dataIndex: 'dateReceive', key: 'dateReceive', width: 150 },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Card className="mb-6">
        <div className="flex items-center mb-4">
          <Title level={4} className="m-0">Detail Invoice</Title>
        </div>
        
        <div className="bg-white p-4 rounded-md">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="font-bold mr-2">{invoiceData.invoiceNumber}</span>
                    <span>- {invoiceData.mdNumber}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <Tag color="blue" className="mr-2">
                      {invoiceData.status}
                    </Tag>
                    <Tag color="orange">
                      {invoiceData.paymentStatus}
                    </Tag>
                  </div>
                  <div className="mb-1">{invoiceData.salesInfo}</div>
                  <div>{invoiceData.businessType}</div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="primary" 
                    className="bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    UPDATE INVOICE
                  </Button>
                  <Button 
                    className="bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    AP
                  </Button>
                  <Button 
                    icon={<UserOutlined />} 
                    className="bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                  />
                  <Button 
                    icon={<ExportOutlined />} 
                    className="bg-blue-400 text-white hover:bg-blue-500 transition-colors"
                  >
                    EXPORT JURNALID
                  </Button>
                  <Button 
                    danger 
                    className="bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    BATALKAN
                  </Button>
                </div>
              </div>

              <Form 
                form={form} 
                layout="vertical" 
                initialValues={{
                  ...invoiceData,
                  transactionDate: invoiceData.transactionDate,
                  dueDate: invoiceData.dueDate,
                }}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Form.Item label="No Invoice" name="invoiceNumber">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Nama depan" name="customerFirstName">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Tgl Transaksi" name="transactionDate">
                      <DatePicker className="w-full" format="DD/MM/YYYY" />
                    </Form.Item>
                  </div>
                  <div>
                    <Form.Item label="Corporate" name="customerType">
                      <Select>
                        <Option value="Personal">Personal</Option>
                        <Option value="Business">Business</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="Nama belakang" name="customerLastName">
                      <Input />
                    </Form.Item>
                    <Form.Item label="Syarat Bayar" name="paymentTerms">
                      <Input />
                    </Form.Item>
                  </div>
                  <div>
                    <Form.Item label="Pelanggan" name="pelanggan">
                      <Select>
                        <Option value="customer1">Select customer...</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="pengiriman" name="pengiriman">
                      <Input />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item label="Tgl Jatuh Tempo" className="mb-0">
                        <div className="text-gray-800">{invoiceData.dueDate?.format('YYYY-MM-DD')}</div>
                      </Form.Item>
                      <Form.Item label="No Telepon" name="phoneNumber">
                        <Input />
                      </Form.Item>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Form.Item label="Alamat Pelanggan" name="customerAddress">
                    <TextArea rows={4} />
                  </Form.Item>
                  <Form.Item label="Note" name="note">
                    <TextArea rows={4} />
                  </Form.Item>
                </div>
              </Form>

              <div className="mb-4">
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddItem}
                  className="bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  Tambah Item
                </Button>
              </div>

              <Table 
                columns={productColumns} 
                dataSource={products} 
                pagination={false} 
                size="middle"
                scroll={{ x: 1300 }}
                bordered
              />
              
              <div className="flex justify-between mt-4">
                <div className="w-1/3">
                  <div className="mb-2">
                    <span className="font-bold">Ket:</span>
                  </div>
                  <div className="mb-1">
                    <span className="mr-2">Asuransi:</span>
                    <span>{invoiceData.insurance?.toLocaleString() || 0}</span>
                  </div>
                  <div className="mb-1">
                    <span className="mr-2">Diskon:</span>
                    <span>{invoiceData.discount?.toLocaleString() || 0}</span>
                  </div>
                  <div>
                    <span className="mr-2">Poin:</span>
                    <span>{invoiceData.point?.toLocaleString() || 0}</span>
                  </div>
                </div>
                
                <div className="w-1/3">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>{invoiceData.subtotal?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Tax</span>
                    <span>{invoiceData.tax?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">Grand Total</span>
                    <span className="font-bold bg-gray-200 px-3 py-1 rounded">
                      {invoiceData.grandTotal?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa Tagihan</span>
                    <span className="bg-gray-200 px-3 py-1 rounded">
                      {invoiceData.remainingPayment?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      
      <Card>
        <Title level={5}>History Receive Payment</Title>
        <Table 
          columns={paymentHistoryColumns} 
          dataSource={paymentHistory} 
          pagination={false}
          size="middle"
          bordered
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}></Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Input defaultValue="0" className="text-right" />
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} colSpan={2}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title={isEditMode ? "Edit Item" : "Tambah Item"}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okButtonProps={{ className: 'bg-blue-500 hover:bg-blue-600' }}
        cancelButtonProps={{ className: 'hover:bg-gray-100' }}
      >
        <Form 
          form={editForm} 
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            const amount = calculateAmount(allValues);
            editForm.setFieldsValue({ amount });
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="product" label="Produk" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
              <InputNumber className="w-full" disabled />
            </Form.Item>
            <Form.Item name="discount" label="Discount" initialValue={0}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="qty" label="Qty" rules={[{ required: true }]} initialValue={0}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="price" label="Price" rules={[{ required: true }]} initialValue={0}>
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item name="tax" label="Tax (%)" initialValue={0}>
              <InputNumber className="w-full" min={0} max={100} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Description">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DetailDummy;
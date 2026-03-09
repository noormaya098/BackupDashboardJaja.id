import React, { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Image, Upload, message } from 'antd';

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

function TabBannerToko() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState([
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
  ]);

 

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => setFileList(newFileList);

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10; // Check if the file size is less than 10MB
    if (!isLt10M) {
      message.error('Image must smaller than 10MB!');
    }
    return isLt10M;
  };

  const uploadButton = (
    <button
      style={{
        border: 0,
        background: 'none',
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  // Gambar 2
  const [previewOpen2, setPreviewOpen2] = useState(false);
  const [previewImage2, setPreviewImage2] = useState('');
  const [fileList2, setFileList2] = useState([
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
    {
      uid: '2',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
    {
      uid: '3',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
  ]);

 

  const handlePreview2 = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage2(file.url || file.preview);
    setPreviewOpen2(true);
  };

  const handleChange2 = ({ fileList: newFileList }) => setFileList2(newFileList);

  const beforeUpload2 = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10; // Check if the file size is less than 10MB
    if (!isLt10M) {
      message.error('Image must smaller than 10MB!');
    }
    return isLt10M;
  };

  const uploadButton2 = (
    <button
      style={{
        border: 0,
        background: 'none',
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  // Gambar 3
  const [previewOpen3, setPreviewOpen3] = useState(false);
  const [previewImage3, setPreviewImage3] = useState('');
  const [fileList3, setFileList3] = useState([
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
    {
      uid: '2',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
    {
      uid: '3',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
  ]);

 

  const handlePreview3 = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage3(file.url || file.preview);
    setPreviewOpen3(true);
  };

  const handleChange3 = ({ fileList: newFileList }) => setFileList3(newFileList);

  const beforeUpload3 = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10; // Check if the file size is less than 10MB
    if (!isLt10M) {
      message.error('Image must smaller than 10MB!');
    }
    return isLt10M;
  };

  const uploadButton3 = (
    <button
      style={{
        border: 0,
        background: 'none',
      }}
      type="button"
    >
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        Upload
      </div>
    </button>
  );

  return (
    <div className='mt-10'>
      <h1 className='text-xl font-semibold'>
        Banner Toko
      </h1>
      <br />
      <hr />
      <br />
      <div className='w-full'>
        <div className='mt-5'>
          <label className='text-lg'>Banner Utama <span className='text-red-500'>*</span></label>
          <div className='mt-5'>
            <>
              <Upload
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                listType="picture-card"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onPreview={handlePreview}
                onChange={handleChange}
                className='w-full'
              >
                {fileList.length >= 12 ? null : uploadButton} {/* Increase max files to 12 */}
              </Upload>
              {previewImage && (
                <Image
                  wrapperStyle={{
                    display: 'none',
                  }}
                  preview={{
                    visible: previewOpen,
                    onVisibleChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                  }}
                  src={previewImage}
                />
              )}
            </>
          </div>
        </div>
      </div>

      <br /><br />
      <div className='w-full'>
        <div className='mt-5'>
          <label className='text-lg'>Slide <span className='text-red-500'>*</span></label>
          <div className='mt-5'>
            <>
              <Upload
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                listType="picture-card"
                fileList={fileList2}
                beforeUpload={beforeUpload2}
                onPreview={handlePreview2}
                onChange={handleChange2}
                className='w-full'
              >
                {fileList2.length >= 12 ? null : uploadButton2} {/* Increase max files to 12 */}
              </Upload>
              {previewImage2 && (
                <Image
                  wrapperStyle={{
                    display: 'none',
                  }}
                  preview={{
                    visible: previewOpen2,
                    onVisibleChange2: (visible) => setPreviewOpen2(visible),
                    afterOpenChange2: (visible) => !visible && setPreviewImage2(''),
                  }}
                  src={previewImage2}
                />
              )}
            </>
          </div>
        </div>
      </div>

      <br /><br />
      <div className='w-full'>
        <div className='mt-5'>
          <label className='text-lg'>Banner Promo <span className='text-red-500'>*</span></label>
          <div className='mt-5'>
            <>
              <Upload
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                listType="picture-card"
                fileList={fileList3}
                beforeUpload={beforeUpload3}
                onPreview={handlePreview3}
                onChange={handleChange3}
                className='w-full'
              >
                {fileList3.length >= 12 ? null : uploadButton3} {/* Increase max files to 12 */}
              </Upload>
              {previewImage3 && (
                <Image
                  wrapperStyle={{
                    display: 'none',
                  }}
                  preview={{
                    visible: previewOpen3,
                    onVisibleChange3: (visible) => setPreviewOpen3(visible),
                    afterOpenChange3: (visible) => !visible && setPreviewImage3(''),
                  }}
                  src={previewImage3}
                />
              )}
            </>
          </div>
        </div>
      </div>

<br />
      <div className='w-full flex justify-end items-end'>
        <Button className='bg-blue-500 text-white h-10 text-lg'>
          Simpan
        </Button>
      </div>
    </div>
  );
}

export default TabBannerToko;

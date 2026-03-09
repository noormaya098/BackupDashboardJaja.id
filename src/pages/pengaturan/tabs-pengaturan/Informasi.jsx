import { Button, Image, Input, Tooltip,Upload } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import React, { useState } from 'react'
import {
  QuestionCircleFilled,
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined
} from '@ant-design/icons';



const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });   


function Informasi() {
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

  const uploadButton = (
    <div
      style={{
        border: 0,
        background: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PlusOutlined style={{ fontSize: '24px' }} />
    </div>
  );


  return (
    <div className='mt-10'>
      <h1 className='text-xl font-semibold'>
        Profil Toko
      </h1>
      <br />
      <hr />
      <br />

      <div className='w-full'>
        <div>
          <label className='text-lg'>Nama Toko</label>
          <Input className='w-full h-10 mt-2' placeholder='ZATATECH'/>
          <p>
            Anda memiliki 1 kesempatan untuk mengubah nama toko
          </p>
        </div>
        <div className='mt-5'>
          <label className='text-lg'>Greeting Message <span className='text-red-500'>*</span></label>
          <Input className='w-full h-10 mt-2' placeholder='Welcome to my store'/>
        </div>
        <div className='mt-5 flex space-x-5'>
          <div className='sm:w-1/2 w-full'>
              <label className='text-lg'>Deskripsi Toko <span className='text-red-500'>*</span></label>
              <TextArea className='w-full mt-2' placeholder='Selamat data di toko kami, produk yang kami sediakan 100% original dan bergaransi resmi' />
          </div>
          <div className='sm:w-1/2 w-full'>
              <label className='text-lg'>Gambar Toko <span className='text-red-500'>*</span> 
              <span className='pl-2'>
                <Tooltip title="Gunakan foto yang memiliki kecerahan cukup, disarankan untuk mengatur bagian foto yang ingin dicrop">
                    <QuestionCircleFilled className='text-gray-700' />  
                </Tooltip></span>
              </label>
               <div className="mt-5 mx-auto">
                <div>
                      <>
                        <Upload
                          className='border-dashed'
                          action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                          listType="picture-card"
                          fileList={fileList}
                          onPreview={handlePreview}
                          onChange={handleChange}
                        >
                          {fileList.length >= 8 ? null : uploadButton}
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
        </div>
      </div>

      <div className='w-full flex justify-end items-end'>
        <Button className='bg-blue-500 text-white h-10 text-lg'>
          Simpan
        </Button>
      </div>
    </div>
  )
}

export default Informasi

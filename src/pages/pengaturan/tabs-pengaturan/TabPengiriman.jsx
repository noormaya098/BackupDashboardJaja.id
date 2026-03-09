import React, { useState } from 'react'
import sicepat from "../../../assets/pengiriman/sicepat.png"
import jne from "../../../assets/pengiriman/jne.png"
import jnt from "../../../assets/pengiriman/jnt.png"
import { Button, Checkbox, Tag } from 'antd'

const shippingOptions = [
  {
    src: sicepat,
    alt: 'SiCepat',
    company: 'SiCepat Express',
    imgClass: 'w-28 h-10',
  },
  {
    src: jnt,
    alt: 'J&T',
    company: 'J&T Express',
    imgClass: 'w-20 h-8',
  },
  {
    src: jne,
    alt: 'JNE',
    company: 'JNE',
    imgClass: 'w-20 h-20',
  },
];

function TabPengiriman() {
  const [checkedState, setCheckedState] = useState(
    new Array(shippingOptions.length).fill(false)
  );

  const handleCheckboxChange = (index) => {
    const updatedCheckedState = checkedState.map((item, idx) =>
      idx === index ? !item : item
    );
    setCheckedState(updatedCheckedState);
  };


  return (
    <div className='mt-10'>
      <h1 className='text-xl font-semibold'>
        Kurir Pengiriman
      </h1>
      <br />
      <hr />
      <br />


      <div className='w-full'>
          <h1 className='text-xl font-semibold'>
            Reguler
          </h1>
          <div className='w-full flex mt-6 space-x-5'>
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className='w-1/2 flex bg-[#f3f4f7] border border-[#e2e7f1] rounded-md'
              >
                <div className='w-full flex p-4'>
                  <div className='w-[3rem] flex items-center'>
                    <input
                      type="checkbox"
                      checked={checkedState[index]}
                      onChange={() => handleCheckboxChange(index)}
                      className={`form-checkbox h-5 w-5 ${checkedState[index] ? 'text-[#64b0c9]' : 'text-gray-600'}`}
                    />
                  </div>
                  <div className='w-1/3 flex items-center'>
                    <img src={option.src} alt={option.alt} className={option.imgClass} />
                  </div>
                  <div className='w-1/2'>
                    <p className='text-lg font-semibold text-[#6c757d]'>
                      {option.company}
                    </p>
                    <p className='mt-2'>
                      <Tag color='blue'>
                        Reguler
                      </Tag>
                    </p>
                  </div>
                </div>
              </div>
            ))}

     
          </div>
      </div>

      <br />
      <div className='w-full flex justify-end items-end'>
        <Button className='bg-blue-500 text-white h-10 text-lg'>
          Simpan
        </Button>
      </div>
    </div>
  )
}

export default TabPengiriman

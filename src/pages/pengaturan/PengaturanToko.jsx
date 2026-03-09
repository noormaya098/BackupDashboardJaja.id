import React from 'react'
import Informasi from './tabs-pengaturan/Informasi';
import TabBannerToko from './tabs-pengaturan/TabBannerToko';
import TabLokasi from './tabs-pengaturan/TabLokasi';
import TabPengiriman from './tabs-pengaturan/TabPengiriman';
import TabJadwalToko from './tabs-pengaturan/TabJadwalToko';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { Tabs } from 'antd';
import { BuildingStorefrontIcon } from '@heroicons/react/24/solid';

const gradientColors = 'from-[#64b0c9] via-[#8ACDE3] to-[#B1EBFE]';


const onChange = (key) => {
  console.log(key);
};
const items = [
  {
    key: '1',
    label: 'Informasi',
    children: <Informasi />,
  },
  {
    key: '2',
    label: 'Banner Toko',
    children: <TabBannerToko />,
  },
  {
    key: '3',
    label: 'Lokasi',
    children: <TabLokasi />,
  },
  {
    key: '4',
    label: 'Pengiriman',
    children: <TabPengiriman />,
  },
  {
    key: '5',
    label: 'Jadwal Toko',
    children: <TabJadwalToko/>,
  },
  
];


function PengaturanToko() {
  return (
    <div className='mt-14'>
      <Card>
          <CardHeader 
                variant="gradient" 
                className={`bg-gradient-to-b ${gradientColors} mb-8 p-6 text-center`}
            >
                <Typography className='text-white font-bold text-lg' variant="h6" color="white">
                    Pengaturan Toko
                </Typography>
            </CardHeader>
            <CardBody>
              <div className=''>
                <div className='flex w-full space-x-4'>
                    <div className='flex justify-center items-center'>
                    <BuildingStorefrontIcon className='w-10 h-10'/>
                    </div>
                    <div className='flex justify-center items-center text-xl font-bold mt-2'>
                      ZATATECH
                    </div>         
                  
                </div>
              </div>
              <br />
                <Tabs
                  defaultActiveKey="1"
                  items={items.map((item) => ({
                    ...item,
                    label: (
                      <span className="tab-label text-lg font-bold">
                        {item.label}
                      </span>
                    ),
                  }))}
                  onChange={onChange}
                  type="card"
                  tabBarStyle={{ marginBottom: '0' }}
                  renderTabBar={(props, DefaultTabBar) => (
                    <DefaultTabBar {...props} className="custom-tab-bar" />
                  )}
                />
            </CardBody>
      </Card>
    </div>
  )
}

export default PengaturanToko

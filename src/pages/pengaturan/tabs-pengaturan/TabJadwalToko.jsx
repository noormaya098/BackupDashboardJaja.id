import React from 'react'
import BukaToko from '../tab-jadwal-toko/BukaToko';
import LiburToko from '../tab-jadwal-toko/LiburToko';
import { Tabs } from 'antd';

const onChange = (key) => {
  console.log(key);
};
const items = [
  {
    key: '1',
    label: 'Buka Toko',
    children: <BukaToko />,
  },
  
  {
    key: '2',
    label: 'Libur Toko',
    children: <LiburToko />,
  },
  
  
];

function TabJadwalToko() {
  return (
    <div className='mt-10'>
      <h1 className='text-xl font-semibold'>
          Jadwal Toko
      </h1>
      <br />
      <hr />
      <br />


      <div>
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
          tabBarStyle={{ marginBottom: '0' }}
          renderTabBar={(props, DefaultTabBar) => (
            <DefaultTabBar {...props} className="custom-tab-bar bg-[#f3f4f7] rounded-lg pt-3 pb-3 pl-4 "  />
            )}
        />
      </div>
    </div>
  )
}

export default TabJadwalToko

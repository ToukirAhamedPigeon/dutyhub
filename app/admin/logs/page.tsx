'use client';

import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import LogListTable from '@/components/module/admin/Logs/List';
import React from 'react';

export default function List(){
    return (
        <>
        <div className='flex flex-col gap-4'>
          <Breadcrumb
          title="Logs"
          showTitle={true}
          items={[
            { label: 'Logs' },
          ]}
        />
        <div className='flex flex-col gap-4'>
          <LogListTable />
        </div>
      </div>    
      </>
    );
}
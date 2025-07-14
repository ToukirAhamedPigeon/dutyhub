'use client';

import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import LookupListTable from '@/components/module/admin/Lookups/List';
import React from 'react';

export default function List(){
    return (
        <>
        <div className='flex flex-col gap-4'>
          <Breadcrumb
          title="Lookups"
          showTitle={true}
          items={[
            { label: 'Lookups' },
          ]}
        />
        <div className='flex flex-col gap-4'>
          <LookupListTable />
        </div>
      </div>    
      </>
    );
}
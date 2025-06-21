'use client';

import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import UserListTable from '@/components/module/admin/Users/List';
import React from 'react';

export default function List(){
    return (
        <>
        <div className='flex flex-col gap-4'>
          <Breadcrumb
          title="Users"
          showTitle={true}
          items={[
            { label: 'Users' },
          ]}
        />
        <div className='flex flex-col gap-4'>
          <UserListTable />
        </div>
      </div>    
      </>
    );
}
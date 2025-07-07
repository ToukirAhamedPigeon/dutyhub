'use client';

import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import RoleListTable from '@/components/module/admin/Roles/List';
import React from 'react';

export default function List(){
    return (
        <>
        <div className='flex flex-col gap-4'>
          <Breadcrumb
          title="Roles"
          showTitle={true}
          items={[
            { label: 'Roles' },
          ]}
        />
        <div className='flex flex-col gap-4'>
          <RoleListTable />
        </div>
      </div>    
      </>
    );
}
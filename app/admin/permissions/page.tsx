'use client';

import Breadcrumb from '@/components/module/admin/layout/Breadcrumb';
import PermissionListTable from '@/components/module/admin/Permissions/List';
import React from 'react';

export default function List(){
    return (
        <>
        <div className='flex flex-col gap-4'>
          <Breadcrumb
          title="Permissions"
          showTitle={true}
          items={[
            { label: 'Permissions' },
          ]}
        />
        <div className='flex flex-col gap-4'>
          <PermissionListTable />
        </div>
      </div>    
      </>
    );
}
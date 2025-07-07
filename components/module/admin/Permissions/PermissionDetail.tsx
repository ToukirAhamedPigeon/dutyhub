'use client';

import { getCustomDateTime } from '@/lib/formatDate';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useTranslations } from 'next-intl';

export default function PermissionDetail({ permission }: { permission: any }) {
  const t = useTranslations();

  // Prepare static rows data
  const rows = [
    { label: 'Name', value: permission.name },
    { label: 'Guard Name', value: permission.guard_name },
    {
      label: 'Permission Roles',
      value: <div className="max-w-[300px] break-words whitespace-normal">{permission.roleNames}</div>,
    },
    {
      label: 'Created By',
      value: permission.created_by_name,
    },
    {
      label: 'Created At',
      value: getCustomDateTime(permission.created_at, 'YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Updated By',
      value: permission.updated_by_name,
    },
    {
      label: 'Updated At',
      value: getCustomDateTime(permission.updated_at, 'YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div className="flex flex-col md:flex-row lg:flex-row gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

      {/* Permission Info */}
      <div className="flex-1">
        <Table>
          <TableBody>
            {rows.map(({ label, value }, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold w-32">{t(label)}:</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

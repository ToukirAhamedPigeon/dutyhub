'use client';

import { getCustomDateTime } from '@/lib/formatDate';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useTranslations } from 'next-intl';

export default function RoleDetail({ role }: { role: any }) {
  const t = useTranslations();

  // Prepare static rows data
  const rows = [
    { label: 'Name', value: role.name },
    { label: 'Guard Name', value: role.guard_name },
    {
      label: 'Role Permissions',
      value: <div className="max-w-[300px] break-words whitespace-normal">{role.permissionNames}</div>,
    },
    {
      label: 'Created By',
      value: role.created_by_name,
    },
    {
      label: 'Created At',
      value: getCustomDateTime(role.created_at, 'YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Updated By',
      value: role.updated_by_name,
    },
    {
      label: 'Updated At',
      value: getCustomDateTime(role.updated_at, 'YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div className="flex flex-col md:flex-row lg:flex-row gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

      {/* Role Info */}
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

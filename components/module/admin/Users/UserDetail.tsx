'use client';

import { formatDateTimeDisplay, getAge, getCustomDateTime } from '@/lib/formatDate';
import Image from 'next/image';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useAppSelector } from '@/hooks/useRedux'
import { useTranslations } from 'next-intl';

export default function UserDetail({ user }: { user: any }) {
  const t = useTranslations();
  const authroles = useAppSelector((state) => state.roles) as string[];
  console.log(user);

  // Prepare static rows data
  const rows = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    ...(authroles.includes('developer')
      ? [{ label: 'Password', value: user.decrypted_password }]
      : []),
    { label: 'Role(s)', value: <span className="capitalize">{user.roleNames}</span> },
    {
      label: 'Role Permissions',
      value: <div className="max-w-[300px] break-words whitespace-normal">{user.rolePermissionNames}</div>,
    },
    {
      label: 'Direct Permission(s)',
      value: <div className="max-w-[300px] break-words whitespace-normal">{user.permissionNames}</div>,
    },
    {
      label: 'Status',
      value:
        user.current_status === 'Active' ? (
          <span className="text-green-600 font-bold">Active</span>
        ) : (
          <span className="text-red-600 font-bold">Inactive</span>
        ),
    },
    { label: 'Username', value: user.username || '-' },
    { label: 'BP No', value: user.bp_no || '-' },
    { label: 'Phone 1', value: user.phone_1 || '-' },
    { label: 'Phone 2', value: user.phone_2 || '-' },
    { label: 'Address', value: user.address || '-' },
    { label: 'Blood Group', value: user.blood_group || '-' },
    { label: 'NID', value: user.nid || '-' },
    {
      label: 'Date of Birth',
      value: user.dob ? formatDateTimeDisplay(user.dob as string, false) : '-',
    },
    {
      label: 'Age',
      value: user.dob ? getAge(user.dob as string) : '-',
    },
    { label: 'Description', value: user.description || '-' },
    {
      label: 'Created At',
      value: getCustomDateTime(user.created_at, 'YYYY-MM-DD HH:mm:ss'),
    },
    {
      label: 'Updated At',
      value: getCustomDateTime(user.updated_at, 'YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div className="flex flex-col md:flex-row lg:flex-row gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Image container */}
      <div className="flex justify-center items-start md:w-1/3 lg:w-1/4">
        <Image
          src={user.image || '/policeman.png'}
          alt={user.name || 'Profile Picture'}
          className="object-cover rounded-xl border-2 border-white shadow-lg"
          width={200}
          height={200}
          priority
        />
      </div>

      {/* User Info */}
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

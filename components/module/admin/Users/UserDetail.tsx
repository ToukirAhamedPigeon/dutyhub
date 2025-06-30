'use client';

import { formatDateTime, formatDateTimeDisplay, getAge } from '@/lib/formatDate';
import Image from 'next/image';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function UserDetail({ user }: { user: any }) {
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
            {/* Basic Info */}
            <TableRow>
              <TableCell className="font-semibold w-32">Name:</TableCell>
              <TableCell>{user.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Email:</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Role:</TableCell>
              <TableCell><span className="capitalize">{user.roleNames}</span></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Status:</TableCell>
              <TableCell>
                {user.current_status === 'Active' ? (
                  <span className="text-green-600 font-bold">Active</span>
                ) : (
                  <span className="text-red-600 font-bold">Inactive</span>
                )}
              </TableCell>
            </TableRow>

            {/* Additional fields */}
            <TableRow>
              <TableCell className="font-semibold">Username:</TableCell>
              <TableCell>{user.username || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">BP No:</TableCell>
              <TableCell>{user.bp_no || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Phone 1:</TableCell>
              <TableCell>{user.phone_1 || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Phone 2:</TableCell>
              <TableCell>{user.phone_2 || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Address:</TableCell>
              <TableCell>{user.address || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Blood Group:</TableCell>
              <TableCell>{user.blood_group || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">NID:</TableCell>
              <TableCell>{user.nid || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Date of Birth:</TableCell>
              <TableCell className="whitespace-normal break-words">
                {user.dob
                  ? formatDateTimeDisplay(user.dob as string, false) 
                  : '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Age:</TableCell>
              <TableCell className="whitespace-normal break-words">
                {user.dob
                  ? getAge(user.dob as string)
                  : '-'}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Description:</TableCell>
              <TableCell>{user.description || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Created At:</TableCell>
              <TableCell>{formatDateTime(user.created_at)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Updated At:</TableCell>
              <TableCell>{formatDateTime(user.updated_at)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

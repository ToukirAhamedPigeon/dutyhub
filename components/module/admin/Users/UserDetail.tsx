'use client';

import { formatDateTime } from '@/lib/formatDate';
import Image from 'next/image';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function UserDetail({user}: {user: any}){
    return (
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/3 w-full flex justify-center items-center">
                    <Image
                        src={user.profilePictureUrl}
                        alt="Profile"
                        className="object-cover rounded-xl border-2 border-white"
                        width={200}
                        height={200}
                    />
                    </div>
                {/* User Info */}
                <div className="flex-1 space-y-4">
                    <Table> 
                        <TableBody>
                            <TableRow>
                                <TableCell><strong>Name:</strong></TableCell>
                                <TableCell>{user.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Email:</strong></TableCell>
                                <TableCell>{user.email}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Role:</strong></TableCell>
                                <TableCell>{<span className='capitalize'>{user.role}</span>}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Status:</strong></TableCell>
                                <TableCell>{user.isActive ? <span className='text-green-500 font-bold'>Active</span> : <span className='text-red-500 font-bold'>Inactive</span>}</TableCell>
                            </TableRow>   
                            <TableRow>
                                <TableCell><strong>Created At:</strong></TableCell>
                                <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Updated At:</strong></TableCell>
                                <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
    );
};
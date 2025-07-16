'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { getCustomDateTime } from '@/lib/formatDate';
import { useTranslations } from 'next-intl';
import { ILookup } from '@/types';

interface LookupDetailProps {
  lookup: ILookup & {
    parent_name?: string | null;
    alt_parent_name?: string | null;
    creator_user_name?: string | null;
    updater_user_name?: string | null;
  };
}

export default function LookupDetail({ lookup }: LookupDetailProps) {
  const t = useTranslations();

  const rows = [
    { label: 'Name', value: lookup.name },
    { label: 'Bangla Name', value: lookup.bn_name || '-' },
    { label: 'Description', value: lookup.description || '-' },
    { label: 'Parent', value: lookup.parent_name || '-' },
    { label: 'Alt Parent', value: lookup.alt_parent_name || '-' },
    { label: 'Created By', value: lookup.creator_user_name || '-' },
    {
      label: 'Created At',
      value: lookup.created_at
        ? getCustomDateTime(new Date(lookup.created_at).toISOString(), 'YYYY-MM-DD HH:mm:ss')
        : '-'
    },
    { label: 'Updated By', value: lookup.updater_user_name || '-' },
    {
      label: 'Updated At',
      value: lookup.updated_at
        ? getCustomDateTime(new Date(lookup.updated_at).toISOString(), 'YYYY-MM-DD HH:mm:ss')
        : '-'
    },
  ];

  return (
    <div className="flex flex-col md:flex-row lg:flex-row gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex-1">
        <Table>
          <TableBody>
            {rows.map(({ label, value }, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold w-40">{t(label)}:</TableCell>
                <TableCell>
                  {typeof value === 'string' || typeof value === 'number' ? (
                    <span className="whitespace-pre-wrap break-words">{value}</span>
                  ) : (
                    value
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

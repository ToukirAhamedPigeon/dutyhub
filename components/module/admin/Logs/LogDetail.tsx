'use client';

import { getCustomDateTime } from '@/lib/formatDate';
import React from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useTranslations } from 'next-intl';

interface LogDetailProps {
  log: {
    detail: string;
    collectionName: string;
    actionType: string;
    objectId: string;
    createdByName: string;
    createdAt: string;
    changes?: Record<string, any>; // expected to be a JSON object
  };
}

export default function LogDetail({ log }: { log: LogDetailProps['log'] }) {
  const t = useTranslations();

  // Convert changes JSON to readable rows
  const changeRows = log.changes
    ? Object.entries(log.changes).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      }))
    : [];

  const rows = [
    { label: 'Detail', value: log.detail ?? 'No detail provided' },
    { label: 'Collection Name', value: log.collectionName },
    { label: 'Action Type', value: log.actionType },
    { label: 'Object ID', value: log.objectId },
    { label: 'Created By', value: log.createdByName },
    { label: 'Created At', value: getCustomDateTime(log.createdAt, 'YYYY-MM-DD HH:mm:ss') },
    ...(changeRows.length > 0
      ? [{ label: 'Changes', value: <ChangeTable changes={changeRows} /> }]
      : []),
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 px-4 md:px-6 py-6 max-w-7xl mx-auto">
      <div className="flex-1">
        <Table>
          <TableBody>
            {rows.map(({ label, value }, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold w-40 align-top">{t(label)}:</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ChangeTable({ changes }: { changes: { label: string; value: string }[] }) {
  return (
    <div className="space-y-1">
      {changes.map(({ label, value }, idx) => (
        <div key={idx}>
          <span className="font-medium">{label}:</span>{' '}
          <span className="whitespace-pre-wrap break-words">{value}</span>
        </div>
      ))}
    </div>
  );
}

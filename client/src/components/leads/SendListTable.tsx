import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '../ui/Badge';
import type { Lead } from '../../types/lead';

const col = createColumnHelper<Lead>();

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' }) : '—';

const columns = [
  col.accessor('shopName', { header: 'Shop Name', cell: (i) => <span className="font-medium text-gray-900">{i.getValue()}</span> }),
  col.accessor('ownerName', { header: 'Owner', cell: (i) => i.getValue() ?? '—' }),
  col.accessor('phoneNumber', { header: 'Phone', cell: (i) => i.getValue() ?? '—' }),
  col.accessor('whatsappNumber', { header: 'WA Number', cell: (i) => i.getValue() ?? '—' }),
  col.accessor('whatsappStatus', {
    header: 'WA Status',
    cell: (i) => <Badge status={i.getValue()} />,
  }),
  col.accessor('whatsappSentAt', { header: 'WA Sent At', cell: (i) => fmt(i.getValue()), enableSorting: false }),
  col.accessor('smsStatus', {
    header: 'SMS Status',
    cell: (i) => <Badge status={i.getValue()} />,
  }),
  col.accessor('smsSentAt', { header: 'SMS Sent At', cell: (i) => fmt(i.getValue()), enableSorting: false }),
  col.accessor('lastError', {
    header: 'Error',
    enableSorting: false,
    cell: (i) => {
      const err = i.getValue();
      if (!err) return <span className="text-gray-300">—</span>;
      return (
        <span title={err} className="text-red-600 text-xs cursor-help max-w-[180px] block truncate">
          {err}
        </span>
      );
    },
  }),
];

interface Props { data: Lead[] }

export default function SendListTable({ data }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const SortIcon = ({ isSorted, canSort }: { isSorted: false | 'asc' | 'desc'; canSort: boolean }) => {
    if (!canSort) return null;
    if (isSorted === 'asc') return <ChevronUp size={13} />;
    if (isSorted === 'desc') return <ChevronDown size={13} />;
    return <ChevronsUpDown size={13} className="opacity-40" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap select-none ${header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon isSorted={header.column.getIsSorted()} canSort={header.column.getCanSort()} />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No results found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <span className="text-sm text-gray-500">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} — {data.length} total
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-white"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

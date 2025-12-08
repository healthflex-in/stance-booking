import React from 'react';
import { toTitleCase } from '@/utils/standard-utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key?: string;
  header: string;
  accessor: keyof T;
  sortable?: boolean;
  className?: string;

  sortFunction?: (a: T, b: T, isAsc: boolean) => number;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;

  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  expandedRow?: (item: T) => React.ReactNode;
  onSelectionChange?: (selectedItems: T[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export default function Table<T extends { id: string | number; _id?: string }>({ 
  columns, 
  data,
  onRowClick,
  expandedRow,
  selectable = false,
  onSelectionChange,
  rowClassName
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof T | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: null,
  });

  const [selectedItems, setSelectedItems] = React.useState<T[]>([]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    const column = columns.find(col => col.accessor === sortConfig.key);

    return [...data].sort((a, b) => {
      if (column?.sortFunction) {
        return column.sortFunction(a, b, sortConfig.direction === 'asc');
      }

      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  const handleSort = (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    if (sortConfig.key !== column.accessor) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-5 h-5" />
    ) : sortConfig.direction === 'desc' ? (
      <ChevronDown className="w-5 h-5" />
    ) : (
      <ChevronsUpDown className="w-3 h-3 text-gray-400" />
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedItems(sortedData);
      onSelectionChange?.(sortedData);
    } else {
      setSelectedItems([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (item: T, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    let newSelectedItems: T[];
    if (event.target.checked) {
      newSelectedItems = [...selectedItems, item];
    } else {
      newSelectedItems = selectedItems.filter(selectedItem => selectedItem.id !== item.id);
    }
    setSelectedItems(newSelectedItems);
    onSelectionChange?.(newSelectedItems);
  };

  const isAllSelected = selectedItems.length === sortedData.length && sortedData.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < sortedData.length;

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-primary-light">
          <tr>
            {selectable && (
              <th className="px-4 py-[14px] text-left font-medium text-gray-500 border border-secondary">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={handleSelectAll}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key || String(column.accessor)}
                className={`px-4 py-[14px] text-left font-medium text-gray-500 border border-secondary ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${column.className || ''}`}
                onClick={() => column.sortable && handleSort(column.accessor)}
              >
                <div className="flex items-center justify-between">
                  {toTitleCase(column.header)}
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => {
            const customRowClass = rowClassName ? rowClassName(item) : '';
            const baseRowClass = onRowClick ? 'cursor-pointer hover:bg-gray-50' : '';
            const finalRowClass = customRowClass || baseRowClass;
            
            return (
              <React.Fragment key={item.id}>
                <tr
                  onClick={() => onRowClick?.(item)}
                  className={finalRowClass}
                >
                  {selectable && (
                    <td className="text-sm text-primary border border-secondary" style={{ padding: '8px 16px' }}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedItems.some(selectedItem => selectedItem.id === item.id)}
                        onChange={(e) => handleSelectItem(item, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={`${item.id}-${column.key || String(column.accessor)}`}
                      className={`text-sm text-primary border border-secondary ${column.className || ''}`}
                      style={{ padding: '8px 16px' }}
                    >
                      {column.render
                        ? column.render(item[column.accessor], item)
                        : String(item[column.accessor])}
                    </td>
                  ))}
                </tr>
                {expandedRow && expandedRow(item)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

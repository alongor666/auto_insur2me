'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InsuranceRecord } from '@/types/insurance';
import { DISPLAY_NAMES } from '@/lib/constants';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Download,
  Search
} from 'lucide-react';

interface DataTableProps {
  data: InsuranceRecord[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

type SortField = keyof InsuranceRecord;
type SortOrder = 'asc' | 'desc' | null;

/**
 * 数据表格组件
 * 支持分页、排序、搜索、导出功能
 */
export function DataTable({
  data,
  loading = false,
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange
}: DataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set([
    'policy_start_year',
    'week_number',
    'third_level_organization',
    'business_type_category',
    'signed_premium_yuan',
    'policy_count'
  ]));

  // 定义可排序的字段
  const sortableFields: (keyof InsuranceRecord)[] = [
    'signed_premium_yuan',
    'policy_count',
    'claim_case_count',
    'business_type_category',
    'terminal_source',
    'customer_category_3',
    'insurance_type',
    'coverage_type'
  ];

  // 可显示的列配置
  const availableColumns: { key: keyof InsuranceRecord; label: string; type: 'text' | 'number' | 'currency' }[] = [
    { key: 'policy_start_year', label: '起保年度', type: 'number' },
    { key: 'week_number', label: '周次', type: 'number' },
    { key: 'chengdu_branch', label: '成都分公司', type: 'text' },
    { key: 'third_level_organization', label: '三级机构', type: 'text' },
    { key: 'business_type_category', label: '业务大类', type: 'text' },
    { key: 'insurance_type', label: '险种', type: 'text' },
    { key: 'customer_category_3', label: '客户三级分类', type: 'text' },
    { key: 'terminal_source', label: '终端来源', type: 'text' },
    { key: 'coverage_type', label: '险别组合', type: 'text' },
    { key: 'renewal_status', label: '新续转状态', type: 'text' },
    { key: 'vehicle_insurance_grade', label: '车险分等级', type: 'text' },
    { key: 'signed_premium_yuan', label: '签单保费', type: 'currency' },
    { key: 'matured_premium_yuan', label: '满期保费', type: 'currency' },
    { key: 'policy_count', label: '保单件数', type: 'number' },
    { key: 'claim_case_count', label: '出险案件数', type: 'number' }
  ];

  /**
   * 处理排序
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 切换排序顺序：asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /**
   * 获取排序图标
   */
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  /**
   * 排序后的数据
   */
  const sortedData = useMemo(() => {
    if (!sortField || !sortOrder) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  /**
   * 搜索过滤后的数据
   */
  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;

    return sortedData.filter(record =>
      Object.values(record).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  /**
   * 格式化单元格值
   */
  const formatCellValue = (value: any, type: 'text' | 'number' | 'currency'): string => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'currency':
        return `¥${Number(value).toLocaleString()}`;
      case 'number':
        return Number(value).toLocaleString();
      case 'text':
      default:
        return String(value);
    }
  };

  /**
   * 导出CSV
   */
  const exportToCSV = () => {
    const headers = availableColumns
      .filter(col => selectedColumns.has(col.key))
      .map(col => col.label);

    const rows = filteredData.map(record =>
      availableColumns
        .filter(col => selectedColumns.has(col.key))
        .map(col => formatCellValue(record[col.key], col.type))
    );

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `车险数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  /**
   * 切换列显示
   */
  const toggleColumn = (columnKey: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey);
    } else {
      newSelected.add(columnKey);
    }
    setSelectedColumns(newSelected);
  };

  // 分页计算
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // 页码选项
  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索数据..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={loading || filteredData.length === 0}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            导出CSV
          </Button>
        </div>
      </div>

      {/* 列选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">显示列</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableColumns.map(column => (
              <label key={column.key} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedColumns.has(column.key)}
                  onChange={() => toggleColumn(column.key)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {column.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {availableColumns
                    .filter(col => selectedColumns.has(col.key))
                    .map(column => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(column.key)}
                      >
                        <div className="flex items-center gap-1">
                          {column.label}
                          {getSortIcon(column.key)}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  // 加载状态
                  Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={index}>
                      {availableColumns
                        .filter(col => selectedColumns.has(col.key))
                        .map(column => (
                          <td key={column.key} className="px-4 py-3">
                            <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
                          </td>
                        ))}
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  // 无数据状态
                  <tr>
                    <td
                      colSpan={availableColumns.filter(col => selectedColumns.has(col.key)).length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {searchTerm ? '未找到匹配的数据' : '暂无数据'}
                    </td>
                  </tr>
                ) : (
                  // 数据行
                  filteredData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {availableColumns
                        .filter(col => selectedColumns.has(col.key))
                        .map(column => (
                          <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                            {formatCellValue(record[column.key], column.type)}
                          </td>
                        ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 分页控件 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* 分页信息 */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            显示 {startRecord} - {endRecord} 条，共 {totalRecords} 条记录
          </span>
          <div className="flex items-center gap-2">
            <span>每页显示</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>条</span>
          </div>
        </div>

        {/* 分页按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {/* 页码 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
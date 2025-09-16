'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InsuranceRecord, AnalysisResult } from '@/types/insurance';
import { DISPLAY_NAMES } from '@/lib/constants';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  data: InsuranceRecord[] | AnalysisResult[];
  filename?: string;
  disabled?: boolean;
  className?: string;
}

type ExportFormat = 'csv' | 'excel';

/**
 * 数据导出组件
 * 支持CSV和Excel格式导出
 */
export function ExportButton({
  data,
  filename = 'insurance_data',
  disabled = false,
  className = ''
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  /**
   * 将数据转换为CSV格式
   */
  const convertToCSV = (records: any[]): string => {
    if (records.length === 0) return '';

    // 获取所有字段名
    const headers = Object.keys(records[0]);
    
    // 创建CSV头部
    const csvHeaders = headers.map(header => 
      DISPLAY_NAMES[header as keyof typeof DISPLAY_NAMES] || header
    ).join(',');

    // 转换数据行
    const csvRows = records.map(record => 
      headers.map(header => {
        const value = record[header];
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  };

  /**
   * 将数据转换为Excel格式（使用CSV作为简化实现）
   */
  const convertToExcel = (records: any[]): string => {
    // 简化实现：使用CSV格式，但添加Excel特定的BOM
    const csv = convertToCSV(records);
    return '\uFEFF' + csv; // 添加BOM以支持中文
  };

  /**
   * 下载文件
   */
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 执行导出
   */
  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      alert('没有数据可导出');
      return;
    }

    setIsExporting(true);
    setShowOptions(false);

    try {
      let content: string;
      let fileExtension: string;
      let mimeType: string;

      if (format === 'csv') {
        content = convertToCSV(data);
        fileExtension = 'csv';
        mimeType = 'text/csv;charset=utf-8';
      } else {
        content = convertToExcel(data);
        fileExtension = 'csv'; // 使用CSV格式但添加了BOM
        mimeType = 'application/vnd.ms-excel;charset=utf-8';
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const fullFilename = `${filename}_${timestamp}.${fileExtension}`;

      downloadFile(content, fullFilename, mimeType);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * 格式化数据量显示
   */
  const formatDataCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}千`;
    }
    return count.toString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* 主导出按钮 */}
      <Button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isExporting || data.length === 0}
        className="flex items-center gap-2"
        variant="outline"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        导出数据
        {data.length > 0 && (
          <span className="text-xs text-gray-500">
            ({formatDataCount(data.length)}条)
          </span>
        )}
      </Button>

      {/* 导出选项面板 */}
      {showOptions && (
        <Card className="absolute top-full left-0 mt-2 w-64 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">选择导出格式</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full justify-start"
              variant="ghost"
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV格式
              <span className="text-xs text-gray-500 ml-auto">
                通用格式
              </span>
            </Button>
            
            <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              className="w-full justify-start"
              variant="ghost"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel格式
              <span className="text-xs text-gray-500 ml-auto">
                支持中文
              </span>
            </Button>

            <div className="pt-2 border-t">
              <Button
                onClick={() => setShowOptions(false)}
                className="w-full"
                variant="outline"
                size="sm"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 点击外部关闭选项面板 */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}

/**
 * 快速CSV导出按钮（简化版本）
 */
export function QuickExportButton({
  data,
  filename = 'data',
  className = ''
}: Omit<ExportButtonProps, 'disabled'>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = async () => {
    if (data.length === 0) return;

    setIsExporting(true);
    try {
      const csv = data.length > 0 ? 
        Object.keys(data[0]).join(',') + '\n' +
        data.map(record => Object.values(record).join(',')).join('\n') : '';
      
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${Date.now()}.csv`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('快速导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleQuickExport}
      disabled={isExporting || data.length === 0}
      size="sm"
      variant="ghost"
      className={`${className} ${data.length === 0 ? 'opacity-50' : ''}`}
    >
      {isExporting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Download className="h-3 w-3" />
      )}
    </Button>
  );
}
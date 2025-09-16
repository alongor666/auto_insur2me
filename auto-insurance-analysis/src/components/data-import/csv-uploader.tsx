'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importCSVData } from '@/lib/data-processor';
import { ImportResult } from '@/types/insurance';

interface CSVUploaderProps {
  onImportComplete?: (result: ImportResult) => void;
  className?: string;
}

/**
 * CSV文件上传组件
 * 支持拖拽上传和点击选择文件
 */
export function CSVUploader({ onImportComplete, className = '' }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('请选择CSV格式的文件');
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const result = await importCSVData(file);
      setImportResult(result);
      onImportComplete?.(result);
    } catch (error) {
      console.error('文件上传失败:', error);
      setImportResult({
        success: false,
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
        errors: [`文件上传失败: ${error}`],
        warnings: []
      });
    } finally {
      setIsUploading(false);
    }
  }, [onImportComplete]);

  /**
   * 处理拖拽事件
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  /**
   * 清除导入结果
   */
  const clearResult = useCallback(() => {
    setImportResult(null);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {isUploading ? '正在处理文件...' : '上传CSV数据文件'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              拖拽文件到此处，或点击选择文件
            </p>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-file-input"
            disabled={isUploading}
          />
          
          <Button
            variant="outline"
            onClick={() => document.getElementById('csv-file-input')?.click()}
            disabled={isUploading}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>选择CSV文件</span>
          </Button>
        </div>
      </div>

      {/* 导入结果显示 */}
      {importResult && (
        <div className={`
          p-4 rounded-lg border
          ${importResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
          }
        `}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <h4 className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.success ? '导入成功' : '导入失败'}
                </h4>
                
                <div className="mt-2 text-sm space-y-1">
                  <div className="flex space-x-4">
                    <span className="text-gray-600">
                      总行数: <span className="font-medium">{importResult.totalRows}</span>
                    </span>
                    <span className="text-green-600">
                      成功: <span className="font-medium">{importResult.validRows}</span>
                    </span>
                    {importResult.errorRows > 0 && (
                      <span className="text-red-600">
                        失败: <span className="font-medium">{importResult.errorRows}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 错误信息 */}
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-1">错误信息:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <p key={index} className="text-xs text-red-700 mb-1">
                          • {error}
                        </p>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-red-600 italic">
                          还有 {importResult.errors.length - 10} 个错误...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 警告信息 */}
                {importResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">警告信息:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 5).map((warning, index) => (
                        <p key={index} className="text-xs text-yellow-700 mb-1">
                          • {warning}
                        </p>
                      ))}
                      {importResult.warnings.length > 5 && (
                        <p className="text-xs text-yellow-600 italic">
                          还有 {importResult.warnings.length - 5} 个警告...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResult}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>支持的文件格式:</strong> CSV (逗号分隔值)</p>
        <p><strong>文件要求:</strong> 包含标准字段名称的表头行</p>
        <p><strong>数据验证:</strong> 自动验证数据格式和业务逻辑</p>
      </div>
    </div>
  );
}
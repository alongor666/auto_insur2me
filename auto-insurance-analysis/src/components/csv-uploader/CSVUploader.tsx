'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/services/dataService';
import { InsuranceRecord } from '@/types/insurance';

interface CSVUploaderProps {
  onDataUpload?: (data: InsuranceRecord[], filename: string) => void;
  onError?: (error: string) => void;
  className?: string;
  maxFileSize?: number; // MB
  acceptedFormats?: string[];
}

interface UploadResult {
  success: boolean;
  data?: InsuranceRecord[];
  filename: string;
  recordCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * CSV文件上传组件
 * 支持拖拽上传、格式验证、数据预览和错误处理
 */
export function CSVUploader({
  onDataUpload,
  onError,
  className = '',
  maxFileSize = 50, // 默认50MB
  acceptedFormats = ['.csv']
}: CSVUploaderProps) {
  const [dataService] = useState(() => DataService.getInstance());
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 验证文件格式和大小
   */
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件扩展名
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `不支持的文件格式。支持的格式: ${acceptedFormats.join(', ')}`;
    }

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `文件大小超出限制。最大支持 ${maxFileSize}MB，当前文件 ${fileSizeMB.toFixed(1)}MB`;
    }

    // 检查文件名格式（可选）
    const expectedPattern = /\d{4}保单第\d+周变动成本明细表\.csv$/;
    if (!expectedPattern.test(file.name)) {
      return `文件名格式不符合规范。期望格式: {年份}保单第{周次}周变动成本明细表.csv`;
    }

    return null;
  }, [acceptedFormats, maxFileSize]);

  /**
   * 处理文件上传
   */
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      // 验证文件
      const validationError = validateFile(file);
      if (validationError) {
        const result: UploadResult = {
          success: false,
          filename: file.name,
          recordCount: 0,
          errors: [validationError],
          warnings: []
        };
        setUploadResult(result);
        onError?.(validationError);
        return;
      }

      // 读取和解析文件
      const data = await dataService.parseCSVFile(file);
      
      const result: UploadResult = {
        success: true,
        data,
        filename: file.name,
        recordCount: data.length,
        errors: [],
        warnings: []
      };

      // 数据质量检查
      if (data.length === 0) {
        result.warnings.push('文件中没有有效的数据记录');
      }

      // 检查必要字段
      const requiredFields = ['snapshot_date', 'signed_premium_yuan', 'policy_count'];
      const sampleRecord = data[0];
      if (sampleRecord) {
        const missingFields = requiredFields.filter(field => 
          !(field in sampleRecord) || sampleRecord[field as keyof InsuranceRecord] === undefined
        );
        if (missingFields.length > 0) {
          result.warnings.push(`缺少必要字段: ${missingFields.join(', ')}`);
        }
      }

      // 检查数据范围
      if (data.length > 0) {
        const years = [...new Set(data.map(r => r.policy_start_year))];
        const weeks = [...new Set(data.map(r => r.week_number))];
        result.warnings.push(`数据包含 ${years.length} 个年份 (${Math.min(...years)}-${Math.max(...years)})，${weeks.length} 个周次 (第${Math.min(...weeks)}-${Math.max(...weeks)}周)`);
      }

      setUploadResult(result);
      onDataUpload?.(data, file.name);

    } catch (error: any) {
      const result: UploadResult = {
        success: false,
        filename: file.name,
        recordCount: 0,
        errors: [`解析文件失败: ${error.message}`],
        warnings: []
      };
      setUploadResult(result);
      onError?.(error.message);
    } finally {
      setIsUploading(false);
    }
  }, [dataService, validateFile, onDataUpload, onError]);

  /**
   * 拖拽事件处理
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  /**
   * 文件选择处理
   */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  /**
   * 清除上传结果
   */
  const clearResult = useCallback(() => {
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * 下载示例文件
   */
  const downloadTemplate = useCallback(() => {
    // 创建示例CSV内容
    const headers = [
      'snapshot_date', 'week_number', 'policy_start_year', 'chengdu_branch',
      'third_level_organization', 'business_type_category', 'customer_category_3',
      'insurance_type', 'coverage_type', 'renewal_status', 'terminal_source',
      'is_new_energy_vehicle', 'is_transferred_vehicle', 'vehicle_insurance_grade',
      'highway_risk_grade', 'large_truck_score', 'small_truck_score',
      'signed_premium_yuan', 'matured_premium_yuan', 'commercial_premium_before_discount_yuan',
      'policy_count', 'claim_case_count', 'reported_claim_payment_yuan',
      'expense_amount_yuan', 'premium_time_progress_plan_yuan', 'marginal_contribution_amount_yuan'
    ];

    const sampleRow = [
      '2024-08-19', '34', '2024', '成都市分公司',
      '某支公司', '车险', '个人客户', '商业保险', '综合险', '续保', '线上',
      '否', '否', 'A', '低风险', '85', '90',
      '5000.0000', '4500.0000', '5200.0000',
      '1', '0', '0.0000',
      '300.0000', '5000.0000', '4200.0000'
    ];

    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '2024保单第34周变动成本明细表_示例.csv';
    link.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <Upload className={`mx-auto w-12 h-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? '正在上传...' : '拖拽CSV文件到此处或点击选择'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              支持格式: {acceptedFormats.join(', ')} | 最大 {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-400 mt-1">
              文件名格式: {'{年份}保单第{周次}周变动成本明细表.csv'}
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              选择文件
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>下载模板</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 上传结果 */}
      {uploadResult && (
        <div className={`
          border rounded-lg p-4 
          ${uploadResult.success 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
          }
        `}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{uploadResult.filename}</span>
                </div>
                
                {uploadResult.success ? (
                  <p className="text-sm text-green-700 mt-1">
                    上传成功！共 {uploadResult.recordCount.toLocaleString()} 条记录
                  </p>
                ) : (
                  <p className="text-sm text-red-700 mt-1">上传失败</p>
                )}

                {/* 错误信息 */}
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">• {error}</p>
                    ))}
                  </div>
                )}

                {/* 警告信息 */}
                {uploadResult.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadResult.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-600">• {warning}</p>
                    ))}
                  </div>
                )}

                {/* 数据预览 */}
                {uploadResult.success && uploadResult.data && uploadResult.data.length > 0 && (
                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <p><strong>数据概览:</strong></p>
                    <p>• 签单保费总额: {uploadResult.data.reduce((sum: number, r: InsuranceRecord) => sum + (r.signed_premium_yuan || 0), 0).toLocaleString()}元</p>
                    <p>• 保单件数: {uploadResult.data.reduce((sum: number, r: InsuranceRecord) => sum + (r.policy_count || 0), 0).toLocaleString()}件</p>
                    <p>• 数据时间: {Math.min(...uploadResult.data.map((r: InsuranceRecord) => r.policy_start_year))}-{Math.max(...uploadResult.data.map((r: InsuranceRecord) => r.policy_start_year))}年</p>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearResult}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
        <p><strong>支持功能:</strong> 拖拽上传、格式验证、数据预览、错误提示</p>
        <p><strong>文件要求:</strong> CSV格式，UTF-8编码，包含标准字段</p>
        <p><strong>数据验证:</strong> 自动检查必要字段、数据类型和业务规则</p>
        <p><strong>性能优化:</strong> 支持大文件上传，自动数据缓存</p>
      </div>
    </div>
  );
}
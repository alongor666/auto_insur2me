/**
 * 车险多维分析系统 - 数据处理器
 * 负责CSV数据导入、清洗、验证和转换
 */

import Papa from 'papaparse';
import { InsuranceRecord, ImportResult, FilterConditions } from '@/types/insurance';
import { CSV_FIELD_MAPPING, VALIDATION_RULES, FIELD_OPTIONS } from '@/lib/constants';
import { validateRecord } from '@/lib/calculations';

/**
 * CSV文件解析和导入
 * @param file CSV文件
 * @returns Promise<ImportResult>
 */
export async function importCSVData(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      errors: [],
      warnings: []
    };

    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      skipEmptyLines: true,
      complete: (parseResult) => {
        try {
          result.totalRows = parseResult.data.length;
          
          if (parseResult.errors.length > 0) {
            result.errors.push(...parseResult.errors.map(err => `解析错误: ${err.message}`));
          }

          const processedData: InsuranceRecord[] = [];
          
          parseResult.data.forEach((row: any, index: number) => {
            try {
              const record = transformRowToRecord(row);
              const validation = validateRecord(record);
              
              if (validation.isValid) {
                processedData.push(record as InsuranceRecord);
                result.validRows++;
              } else {
                result.errorRows++;
                result.errors.push(`第${index + 2}行: ${validation.errors.join(', ')}`);
              }
              
              if (validation.warnings.length > 0) {
                result.warnings.push(`第${index + 2}行: ${validation.warnings.join(', ')}`);
              }
            } catch (error) {
              result.errorRows++;
              result.errors.push(`第${index + 2}行: 数据转换失败 - ${error}`);
            }
          });

          // 存储处理后的数据到本地存储
          if (processedData.length > 0) {
            storeDataLocally(processedData);
            result.success = true;
          }

        } catch (error) {
          result.errors.push(`处理失败: ${error}`);
        }

        resolve(result);
      },
      error: (error) => {
        result.errors.push(`文件读取失败: ${error.message}`);
        resolve(result);
      }
    });
  });
}

/**
 * 将CSV行数据转换为InsuranceRecord
 * @param row CSV行数据
 * @returns InsuranceRecord
 */
function transformRowToRecord(row: any): Partial<InsuranceRecord> {
  const record: Partial<InsuranceRecord> = {};

  // 字段映射和类型转换
  Object.entries(CSV_FIELD_MAPPING).forEach(([csvField, recordField]) => {
    const value = row[csvField];
    
    if (value === undefined || value === null || value === '') {
      return;
    }

    try {
      // 根据字段类型进行转换
      if (VALIDATION_RULES.numeric.includes(recordField as any)) {
        // 数值类型转换
        const numValue = typeof value === 'string' ? 
          parseFloat(value.replace(/[,，]/g, '')) : Number(value);
        
        if (!isNaN(numValue)) {
          (record as any)[recordField] = numValue;
        }
      } else if (VALIDATION_RULES.boolean.includes(recordField as any)) {
        // 布尔类型转换
        const boolValue = value === true || value === 'true' || 
                         value === '是' || value === 'True' || value === 1;
        (record as any)[recordField] = boolValue;
      } else {
        // 字符串类型
        (record as any)[recordField] = String(value).trim();
      }
    } catch (error) {
      throw new Error(`字段 ${csvField} 转换失败: ${error}`);
    }
  });

  return record;
}

/**
 * 本地数据存储
 * @param data 保险记录数组
 */
function storeDataLocally(data: InsuranceRecord[]): void {
  try {
    // 获取现有数据
    const existingData = getStoredData();
    
    // 合并新数据（简单追加，实际应用中可能需要去重逻辑）
    const mergedData = [...existingData, ...data];
    
    // 存储到localStorage（实际应用中应使用数据库）
    localStorage.setItem('insurance_data', JSON.stringify(mergedData));
    localStorage.setItem('data_last_updated', new Date().toISOString());
    
    console.log(`成功存储 ${data.length} 条记录，总计 ${mergedData.length} 条记录`);
  } catch (error) {
    console.error('数据存储失败:', error);
    throw new Error('数据存储失败');
  }
}

/**
 * 获取本地存储的数据
 * @returns InsuranceRecord[]
 */
export function getStoredData(): InsuranceRecord[] {
  try {
    const data = localStorage.getItem('insurance_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('数据读取失败:', error);
    return [];
  }
}

/**
 * 清空本地数据
 */
export function clearStoredData(): void {
  localStorage.removeItem('insurance_data');
  localStorage.removeItem('data_last_updated');
}

/**
 * 获取数据最后更新时间
 * @returns Date | null
 */
export function getDataLastUpdated(): Date | null {
  const timestamp = localStorage.getItem('data_last_updated');
  return timestamp ? new Date(timestamp) : null;
}

/**
 * 数据筛选
 * @param data 原始数据
 * @param filters 筛选条件
 * @returns 筛选后的数据
 */
export function filterData(data: InsuranceRecord[], filters: FilterConditions): InsuranceRecord[] {
  return data.filter(record => {
    return Object.entries(filters).every(([field, condition]) => {
      const recordValue = (record as any)[field];
      
      if (condition === undefined || condition === null) {
        return true;
      }
      
      // 数组条件（多选）
      if (Array.isArray(condition)) {
        return condition.length === 0 || condition.includes(recordValue);
      }
      
      // 单值条件
      return recordValue === condition;
    });
  });
}

/**
 * 数据排序
 * @param data 数据数组
 * @param sortField 排序字段
 * @param sortOrder 排序方向
 * @returns 排序后的数据
 */
export function sortData(
  data: InsuranceRecord[], 
  sortField: keyof InsuranceRecord, 
  sortOrder: 'asc' | 'desc' = 'asc'
): InsuranceRecord[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === bValue) return 0;
    
    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * 数据分页
 * @param data 数据数组
 * @param page 页码（从1开始）
 * @param pageSize 每页大小
 * @returns 分页结果
 */
export function paginateData(
  data: InsuranceRecord[], 
  page: number = 1, 
  pageSize: number = 1000
): {
  data: InsuranceRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: data.slice(startIndex, endIndex),
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * 数据统计摘要
 * @param data 数据数组
 * @returns 统计摘要
 */
export function getDataSummary(data: InsuranceRecord[]): {
  totalRecords: number;
  dateRange: { start: string; end: string } | null;
  yearRange: { start: number; end: number } | null;
  weekRange: { start: number; end: number } | null;
  organizationCount: number;
  businessTypeCount: number;
} {
  if (data.length === 0) {
    return {
      totalRecords: 0,
      dateRange: null,
      yearRange: null,
      weekRange: null,
      organizationCount: 0,
      businessTypeCount: 0
    };
  }

  const dates = data
    .map(r => r.snapshot_date)
    .filter(Boolean)
    .sort();
  
  const years = data
    .map(r => r.policy_start_year)
    .filter(Boolean);
  
  const weeks = data
    .map(r => r.week_number)
    .filter(Boolean);
  
  const organizations = new Set(
    data.map(r => r.third_level_organization).filter(Boolean)
  );
  
  const businessTypes = new Set(
    data.map(r => r.business_type_category).filter(Boolean)
  );

  return {
    totalRecords: data.length,
    dateRange: dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : null,
    yearRange: years.length > 0 ? {
      start: Math.min(...years),
      end: Math.max(...years)
    } : null,
    weekRange: weeks.length > 0 ? {
      start: Math.min(...weeks),
      end: Math.max(...weeks)
    } : null,
    organizationCount: organizations.size,
    businessTypeCount: businessTypes.size
  };
}

/**
 * 数据导出为CSV
 * @param data 数据数组
 * @param filename 文件名
 */
export function exportToCSV(data: InsuranceRecord[], filename: string = 'insurance_data.csv'): void {
  const csv = Papa.unparse(data, {
    header: true
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
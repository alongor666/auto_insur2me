/**
 * 车险多维分析系统 - 数据库架构设计
 * 基于PRD文档的17个筛选维度和19个核心指标字段
 */

import { InsuranceRecord, FilterConditions, AnalysisResult } from '@/types/insurance';
import { getStoredData, filterData, sortData, paginateData } from '@/lib/data-processor';
import { groupByAndCalculate, calculateAnalysisResult } from '@/lib/calculations';

/**
 * 数据库架构设计
 * 
 * 主表: insurance_records
 * 包含所有17个筛选维度字段和9个绝对值字段
 * 
 * 索引策略:
 * 1. 主键索引: id (自增主键)
 * 2. 时间索引: (policy_start_year, week_number)
 * 3. 机构索引: (chengdu_branch, third_level_organization)
 * 4. 业务索引: (business_type_category, insurance_type)
 * 5. 复合索引: (policy_start_year, week_number, third_level_organization)
 * 
 * 分区策略:
 * 按年度分区，提高查询性能
 */

export interface DatabaseConfig {
  // 数据库连接配置（实际应用中使用）
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  
  // 本地存储配置
  useLocalStorage: boolean;
  maxRecords: number;
  cacheTimeout: number;
}

export class InsuranceDatabase {
  private config: DatabaseConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: DatabaseConfig = {
    useLocalStorage: true,
    maxRecords: 100000,
    cacheTimeout: 300000 // 5分钟
  }) {
    this.config = config;
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(operation: string, params: any): string {
    return `${operation}_${JSON.stringify(params)}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.config.cacheTimeout;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存
   */
  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 查询所有记录
   */
  async findAll(): Promise<InsuranceRecord[]> {
    const cacheKey = this.getCacheKey('findAll', {});
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const data = getStoredData();
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * 根据条件查询记录
   */
  async findByConditions(
    filters: FilterConditions,
    sortField?: keyof InsuranceRecord,
    sortOrder: 'asc' | 'desc' = 'asc',
    page: number = 1,
    pageSize: number = 1000
  ): Promise<{
    data: InsuranceRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const cacheKey = this.getCacheKey('findByConditions', {
      filters, sortField, sortOrder, page, pageSize
    });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // 获取所有数据
    const allData = await this.findAll();
    
    // 应用筛选条件
    let filteredData = filterData(allData, filters);
    
    // 应用排序
    if (sortField) {
      filteredData = sortData(filteredData, sortField, sortOrder);
    }
    
    // 应用分页
    const result = paginateData(filteredData, page, pageSize);
    
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 聚合查询 - 按维度分组计算指标
   */
  async aggregateByDimensions(
    dimensions: (keyof InsuranceRecord)[],
    filters: FilterConditions = {},
    limit: number = 1000
  ): Promise<AnalysisResult[]> {
    const cacheKey = this.getCacheKey('aggregateByDimensions', {
      dimensions, filters, limit
    });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // 获取筛选后的数据
    const allData = await this.findAll();
    const filteredData = filterData(allData, filters);
    
    // 按维度分组并计算
    const results = groupByAndCalculate(filteredData, dimensions);
    
    // 按记录数排序并限制结果数量
    const sortedResults = results
      .sort((a, b) => b.record_count - a.record_count)
      .slice(0, limit);
    
    this.setCache(cacheKey, sortedResults);
    return sortedResults;
  }

  /**
   * 获取汇总统计
   */
  async getSummaryStats(filters: FilterConditions = {}): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey('getSummaryStats', { filters });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const allData = await this.findAll();
    const filteredData = filterData(allData, filters);
    
    const result = calculateAnalysisResult(filteredData);
    
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 时间序列分析
   */
  async getTimeSeriesData(
    groupBy: 'year' | 'week' | 'year_week',
    filters: FilterConditions = {}
  ): Promise<AnalysisResult[]> {
    const cacheKey = this.getCacheKey('getTimeSeriesData', { groupBy, filters });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    let dimensions: (keyof InsuranceRecord)[];
    
    switch (groupBy) {
      case 'year':
        dimensions = ['policy_start_year'];
        break;
      case 'week':
        dimensions = ['week_number'];
        break;
      case 'year_week':
        dimensions = ['policy_start_year', 'week_number'];
        break;
    }

    const result = await this.aggregateByDimensions(dimensions, filters);
    
    // 按时间排序
    const sortedResult = result.sort((a, b) => {
      if (groupBy === 'year') {
        return (a.dimensions.policy_start_year || 0) - (b.dimensions.policy_start_year || 0);
      } else if (groupBy === 'week') {
        return (a.dimensions.week_number || 0) - (b.dimensions.week_number || 0);
      } else {
        const yearDiff = (a.dimensions.policy_start_year || 0) - (b.dimensions.policy_start_year || 0);
        if (yearDiff !== 0) return yearDiff;
        return (a.dimensions.week_number || 0) - (b.dimensions.week_number || 0);
      }
    });

    this.setCache(cacheKey, sortedResult);
    return sortedResult;
  }

  /**
   * 获取维度选项值
   */
  async getDimensionValues(dimension: keyof InsuranceRecord): Promise<any[]> {
    const cacheKey = this.getCacheKey('getDimensionValues', { dimension });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const allData = await this.findAll();
    const values = [...new Set(allData.map(record => (record as any)[dimension]))]
      .filter(value => value !== null && value !== undefined)
      .sort();

    this.setCache(cacheKey, values);
    return values;
  }

  /**
   * 获取数据质量报告
   */
  async getDataQualityReport(): Promise<{
    totalRecords: number;
    completenessReport: { [field: string]: { total: number; missing: number; rate: number } };
    duplicateRecords: number;
    dataRanges: { [field: string]: { min: any; max: any } };
  }> {
    const cacheKey = this.getCacheKey('getDataQualityReport', {});
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const allData = await this.findAll();
    const totalRecords = allData.length;

    // 完整性报告
    const completenessReport: any = {};
    const numericFields = [
      'policy_start_year', 'week_number', 'signed_premium_yuan', 
      'matured_premium_yuan', 'policy_count', 'claim_case_count'
    ];

    numericFields.forEach(field => {
      const missing = allData.filter(record => 
        (record as any)[field] === null || 
        (record as any)[field] === undefined || 
        isNaN((record as any)[field])
      ).length;
      
      completenessReport[field] = {
        total: totalRecords,
        missing,
        rate: totalRecords > 0 ? ((totalRecords - missing) / totalRecords * 100) : 0
      };
    });

    // 数据范围
    const dataRanges: any = {};
    numericFields.forEach(field => {
      const values = allData
        .map(record => (record as any)[field])
        .filter(value => value !== null && value !== undefined && !isNaN(value));
      
      if (values.length > 0) {
        dataRanges[field] = {
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    // 重复记录检查（简化版本）
    const duplicateRecords = 0; // 实际应用中需要更复杂的逻辑

    const result = {
      totalRecords,
      completenessReport,
      duplicateRecords,
      dataRanges
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 批量插入记录
   */
  async insertBatch(records: InsuranceRecord[]): Promise<{ success: boolean; insertedCount: number }> {
    try {
      // 在实际应用中，这里应该是数据库插入操作
      // 目前使用本地存储模拟
      const existingData = getStoredData();
      const newData = [...existingData, ...records];
      
      localStorage.setItem('insurance_data', JSON.stringify(newData));
      localStorage.setItem('data_last_updated', new Date().toISOString());
      
      // 清除缓存
      this.clearCache();
      
      return {
        success: true,
        insertedCount: records.length
      };
    } catch (error) {
      console.error('批量插入失败:', error);
      return {
        success: false,
        insertedCount: 0
      };
    }
  }

  /**
   * 删除所有数据
   */
  async truncate(): Promise<void> {
    localStorage.removeItem('insurance_data');
    localStorage.removeItem('data_last_updated');
    this.clearCache();
  }

  /**
   * 获取数据库统计信息
   */
  async getStats(): Promise<{
    recordCount: number;
    cacheSize: number;
    lastUpdated: Date | null;
    memoryUsage: number;
  }> {
    const data = getStoredData();
    const lastUpdated = localStorage.getItem('data_last_updated');
    
    return {
      recordCount: data.length,
      cacheSize: this.cache.size,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
      memoryUsage: JSON.stringify(data).length // 粗略估算
    };
  }
}

// 单例实例
export const db = new InsuranceDatabase();
import Papa from 'papaparse';
import { InsuranceRecord, FilterConditions, AnalysisResult, ImportResult, DataCatalog, AvailableYears, AvailableWeeks, FilterDimensions } from '@/types/insurance';
import { MetricCalculator, MetricCalculationResult, calculateAllMetrics, calculateMetricsByDimensions } from './metricCalculator';

/**
 * 数据服务类 - 浏览器版本
 * 处理CSV文件解析、数据缓存和管理
 */
export class DataService {
  private static instance: DataService;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

  /**
   * 获取单例实例
   */
  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(prefix: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${prefix}_${paramStr}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cacheEntry: any): boolean {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
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
    const cacheEntry = this.cache.get(key);
    if (this.isCacheValid(cacheEntry)) {
      return cacheEntry.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 模拟扫描数据目录 - 浏览器版本
   * 返回预设的数据目录结构
   */
  async scanDataDirectory(): Promise<DataCatalog> {
    const cacheKey = this.getCacheKey('scan_directory');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // 模拟数据目录结构
     const catalog: DataCatalog = {
       totalYears: 2,
       totalFiles: 18,
       filePaths: [
         "data/2024保单第28周变动成本明细表.csv",
         "data/2024保单第29周变动成本明细表.csv",
         "data/2024保单第30周变动成本明细表.csv",
         "data/2024保单第31周变动成本明细表.csv",
         "data/2024保单第33周变动成本明细表.csv",
         "data/2024保单第34周变动成本明细表.csv",
         "data/2024保单第35周变动成本明细表.csv",
         "data/2024保单第36周变动成本明细表.csv",
         "data/2024保单第37周变动成本明细表.csv",
         "data/2025保单第28周变动成本明细表.csv",
         "data/2025保单第29周变动成本明细表.csv",
         "data/2025保单第30周变动成本明细表.csv",
         "data/2025保单第31周变动成本明细表.csv",
         "data/2025保单第33周变动成本明细表.csv",
         "data/2025保单第34周变动成本明细表.csv",
         "data/2025保单第35周变动成本明细表.csv",
         "data/2025保单第36周变动成本明细表.csv",
         "data/2025保单第37周变动成本明细表.csv"
       ],
       missingWeeks: {
         "2024": [32],
         "2025": [32]
       },
       lastScanTime: new Date().toISOString()
     };

    this.setCache(cacheKey, catalog);
    return catalog;
  }

  /**
    * 获取可用年份
    */
   async getAvailableYears(): Promise<AvailableYears> {
     const cacheKey = this.getCacheKey('available_years');
     const cached = this.getCache(cacheKey);
     if (cached) return cached;

     const years: AvailableYears = {
       years: [2024, 2025],
       lastUpdated: new Date().toISOString()
     };

     this.setCache(cacheKey, years);
     return years;
   }

  /**
   * 获取可用周次
   */
  async getAvailableWeeks(): Promise<AvailableWeeks> {
    const cacheKey = this.getCacheKey('available_weeks');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const weeks: AvailableWeeks = {
      "2024": [28, 29, 30, 31, 33, 34, 35, 36, 37],
      "2025": [28, 29, 30, 31, 33, 34, 35, 36, 37]
    };

    this.setCache(cacheKey, weeks);
    return weeks;
  }

  /**
   * 模拟加载指定年份和周次的数据
   */
  async loadDataByYearWeek(year: number, week?: number): Promise<InsuranceRecord[]> {
    const cacheKey = this.getCacheKey('load_data', { year, week });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 生成模拟数据
    const mockData = this.generateMockData(year, week);
    
    this.setCache(cacheKey, mockData);
    return mockData;
  }

  /**
   * 生成模拟数据
   */
  private generateMockData(year: number, week?: number): InsuranceRecord[] {
    const data: InsuranceRecord[] = [];
    const weeks = week ? [week] : [28, 29, 30, 31, 33, 34, 35, 36, 37];
    
    const organizations = ['成都市分公司', '绵阳市分公司', '德阳市分公司'];
    const businessTypes = ['车险', '非车险'];
    const customerTypes = ['个人客户', '企业客户'];
    const insuranceTypes = ['交强险', '商业保险'];

    weeks.forEach(weekNum => {
      organizations.forEach(org => {
        businessTypes.forEach(business => {
          customerTypes.forEach(customer => {
            insuranceTypes.forEach(insurance => {
              data.push({
                snapshot_date: `${year}-${String(Math.floor(weekNum / 4) + 1).padStart(2, '0')}-${String((weekNum % 4) * 7 + 1).padStart(2, '0')}`,
                week_number: weekNum,
                policy_start_year: year,
                chengdu_branch: '成都市分公司',
                third_level_organization: org,
                business_type_category: business,
                customer_category_3: customer,
                insurance_type: insurance,
                coverage_type: insurance === '交强险' ? '交强险' : '综合险',
                renewal_status: Math.random() > 0.5 ? '续保' : '新保',
                terminal_source: Math.random() > 0.5 ? '线上' : '线下',
                is_new_energy_vehicle: Math.random() > 0.8,
                 is_transferred_vehicle: Math.random() > 0.9,
                 vehicle_insurance_grade: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
                 highway_risk_grade: ['低风险', '中风险', '高风险'][Math.floor(Math.random() * 3)],
                 large_truck_score: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
                 small_truck_score: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
                signed_premium_yuan: Math.random() * 10000 + 1000,
                matured_premium_yuan: Math.random() * 9000 + 900,
                commercial_premium_before_discount_yuan: Math.random() * 11000 + 1100,
                policy_count: Math.floor(Math.random() * 10) + 1,
                claim_case_count: Math.floor(Math.random() * 3),
                 reported_claim_payment_yuan: Math.random() * 5000,
                 expense_amount_yuan: Math.random() * 1000 + 100,
                 matured_margin_contribution_yuan: Math.random() * 3000 + 500,
                 variable_cost_amount_yuan: Math.random() * 2000 + 300
              });
            });
          });
        });
      });
    });

    return data;
  }

  /**
   * 解析上传的CSV文件
   */
  async parseCSVFile(file: File): Promise<InsuranceRecord[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          if (!csvText) {
            reject(new Error('文件内容为空'));
            return;
          }

          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
            transform: (value: string, header: string) => {
              // 数值字段转换
              const numericFields = [
                'signed_premium_yuan', 'matured_premium_yuan', 'commercial_premium_before_discount_yuan',
                'policy_count', 'claim_case_count', 'reported_claim_payment_yuan',
                'expense_amount_yuan', 'premium_time_progress_plan_yuan', 'marginal_contribution_amount_yuan',
                'week_number', 'policy_start_year', 'large_truck_score', 'small_truck_score'
              ];
              
              if (numericFields.includes(header)) {
                const num = parseFloat(value);
                return isNaN(num) ? 0 : num;
              }
              
              return value.trim();
            },
            complete: (results) => {
              if (results.errors.length > 0) {
                reject(new Error(`CSV解析错误: ${results.errors.map(e => e.message).join(', ')}`));
                return;
              }

              try {
                const records = results.data as InsuranceRecord[];
                resolve(records);
              } catch (error: any) {
                reject(new Error(`数据转换错误: ${error.message}`));
              }
            },
            error: (error: any) => {
              reject(new Error(`CSV解析失败: ${error.message}`));
            }
          });
        } catch (error: any) {
          reject(new Error(`文件读取错误: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 计算全局指标 - 对所有数据进行聚合计算
   * @param data 原始数据数组
   * @returns 全局指标计算结果
   */
  async calculateGlobalMetrics(data: InsuranceRecord[]): Promise<MetricCalculationResult> {
    const cacheKey = this.getCacheKey('global_metrics', { dataLength: data.length });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const result = calculateAllMetrics(data);
    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 按维度计算指标 - 支持多维度分组分析
   * @param data 原始数据数组
   * @param dimensions 分组维度数组
   * @returns 分组指标计算结果数组
   */
  async calculateMetricsByDimensions(
    data: InsuranceRecord[], 
    dimensions: (keyof FilterDimensions)[]
  ): Promise<MetricCalculationResult[]> {
    const cacheKey = this.getCacheKey('dimensional_metrics', { 
      dataLength: data.length, 
      dimensions: dimensions.sort() 
    });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const results = calculateMetricsByDimensions(data, dimensions);
    this.setCache(cacheKey, results);
    return results;
  }

  /**
   * 获取指标计算结果 - 支持筛选条件和维度分组
   * @param filters 筛选条件
   * @param groupByDimensions 分组维度（可选）
   * @returns 指标计算结果
   */
  async getMetricsAnalysis(
    filters?: FilterConditions,
    groupByDimensions?: (keyof FilterDimensions)[]
  ): Promise<MetricCalculationResult[]> {
    // 根据筛选条件加载数据
    let data: InsuranceRecord[] = [];
    
    if (filters && 'policy_start_year' in filters && filters.policy_start_year) {
      const years = Array.isArray(filters.policy_start_year) 
        ? filters.policy_start_year 
        : [filters.policy_start_year];
      
      for (const year of years) {
        const yearData = await this.loadDataByYearWeek(year);
        data = data.concat(yearData);
      }
    } else {
      // 如果没有指定年份，加载最近的数据
      const availableYears = await this.getAvailableYears();
      if (availableYears.years.length > 0) {
        const latestYear = Math.max(...availableYears.years);
        data = await this.loadDataByYearWeek(latestYear);
      }
    }

    // 应用其他筛选条件
    if (filters) {
      data = this.applyFilters(data, filters);
    }

    // 计算指标
    if (groupByDimensions && groupByDimensions.length > 0) {
      return await this.calculateMetricsByDimensions(data, groupByDimensions);
    } else {
      const globalResult = await this.calculateGlobalMetrics(data);
      return [globalResult];
    }
  }

  /**
   * 应用筛选条件
   * @param data 原始数据
   * @param filters 筛选条件
   * @returns 筛选后的数据
   */
  private applyFilters(data: InsuranceRecord[], filters: FilterConditions): InsuranceRecord[] {
    return data.filter(record => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue;
        
        const recordValue = record[key as keyof InsuranceRecord];
        
        if (Array.isArray(value)) {
          if (!value.includes(recordValue as any)) return false;
        } else {
          if (recordValue !== value) return false;
        }
      }
      return true;
    });
  }
}
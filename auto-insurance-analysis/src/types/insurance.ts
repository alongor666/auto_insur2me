/**
 * 车险多维分析系统 - 数据类型定义
 * 基于PRD文档中的17个筛选维度和19个核心指标字段
 */

// 数据目录相关类型定义
export interface DataCatalog {
  totalYears: number;
  totalFiles: number;
  filePaths: string[];
  missingWeeks: {
    [year: string]: number[];
  };
  lastScanTime: string;
}

export interface AvailableYears {
  years: number[];
  lastUpdated: string;
}

export interface AvailableWeeks {
  [year: string]: number[];
}

// 筛选维度字段类型定义
export interface FilterDimensions {
  // 时间维度
  policy_start_year: number;           // 起保年度
  week_number: number;                 // 周序号
  snapshot_date: string;               // 数据快照日期

  // 机构维度
  chengdu_branch: string;              // 机构层级 (中支/成都)
  third_level_organization: string;    // 三级机构/城市

  // 业务维度
  business_type_category: string;      // 业务类型分类
  customer_category_3: string;         // 客户三级分类
  insurance_type: string;              // 险种类型 (交强险/商业保险)
  coverage_type: string;               // 险别组合 (主全/交三/单交)
  renewal_status: string;              // 新续转状态 (新保/续保/转保)
  terminal_source: string;             // 终端来源

  // 车辆属性维度
  is_new_energy_vehicle: boolean;      // 是否新能源车
  is_transferred_vehicle: boolean;     // 是否过户车

  // 风险评级维度
  vehicle_insurance_grade: string;     // 车险分等级 (A-G, X)
  highway_risk_grade: string;          // 高速风险等级 (A-E, X)
  large_truck_score: string;           // 大货车评分 (A-E, X)
  small_truck_score: string;           // 小货车评分 (A-E, X)
}

// 绝对值字段类型定义（用于聚合计算）
export interface AbsoluteValueFields {
  // 保费类（单位：元）
  signed_premium_yuan: number;                    // 签单保费
  matured_premium_yuan: number;                   // 满期保费
  commercial_premium_before_discount_yuan: number; // 商业险折前保费

  // 数量类（单位：件）
  policy_count: number;                           // 保单件数
  claim_case_count: number;                       // 赔案件数

  // 赔款类（单位：元）
  reported_claim_payment_yuan: number;            // 已报告赔款

  // 成本类（单位：元）
  expense_amount_yuan: number;                    // 费用金额
  matured_margin_contribution_yuan: number;       // 满期边际贡献额
  variable_cost_amount_yuan: number;              // 变动成本金额
}

// 计算字段类型定义（实时计算，不存储）
export interface CalculatedFields {
  // 平均值类
  average_premium_per_policy_yuan: number;        // 单均保费
  average_claim_payment_yuan: number;             // 案均赔款

  // 比率类（百分比）
  claim_frequency_percent: number;                // 满期出险率
  expired_loss_ratio_percent: number;             // 满期赔付率
  expense_ratio_percent: number;                  // 费用率
  variable_cost_ratio_percent: number;            // 变动成本率
  matured_margin_contribution_rate_percent: number; // 满期边际贡献率

  // 系数类
  commercial_auto_underwriting_factor: number;    // 商业险自主定价系数

  // 其他计算字段
  combined_ratio_percent: number;                 // 综合成本率
  profit_margin_percent: number;                  // 利润率
}

// 完整的车险数据记录类型
export interface InsuranceRecord extends FilterDimensions, AbsoluteValueFields {
  id?: string;                                    // 记录ID（可选）
}

// 聚合后的分析结果类型
export interface AnalysisResult extends AbsoluteValueFields, CalculatedFields {
  // 聚合维度信息
  dimensions: Partial<FilterDimensions>;
  record_count: number;                           // 聚合记录数
}

// 筛选条件类型
export interface FilterConditions {
  [K in keyof FilterDimensions]?: FilterDimensions[K] | FilterDimensions[K][];
}

// 字段选项类型定义
export interface FieldOptions {
  business_type_category: string[];
  chengdu_branch: string[];
  third_level_organization: string[];
  customer_category_3: string[];
  insurance_type: string[];
  coverage_type: string[];
  renewal_status: string[];
  vehicle_insurance_grade: string[];
  highway_risk_grade: string[];
  large_truck_score: string[];
  small_truck_score: string[];
  terminal_source: string[];
  policy_start_year: number[];
  week_number: number[];
}

// 图表数据类型
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

// 仪表盘配置类型
export interface DashboardConfig {
  selectedDimensions: (keyof FilterDimensions)[];
  selectedMetrics: (keyof AbsoluteValueFields | keyof CalculatedFields)[];
  filters: FilterConditions;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  timeRange: {
    startYear: number;
    endYear: number;
    startWeek?: number;
    endWeek?: number;
  };
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

// 数据导入结果类型
export interface ImportResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: string[];
  warnings: string[];
}

// 性能监控类型
export interface PerformanceMetrics {
  queryTime: number;                              // 查询耗时（毫秒）
  renderTime: number;                             // 渲染耗时（毫秒）
  dataSize: number;                               // 数据大小（字节）
  cacheHit: boolean;                              // 是否命中缓存
}
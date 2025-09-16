/**
 * 车险多维分析系统 - 常量定义
 * 基于字段选项明细文档的枚举值和配置
 */

import { FieldOptions } from '@/types/insurance';

// 字段选项常量
export const FIELD_OPTIONS = {
  // 筛选维度字段（17个）
  filterDimensions: [
    'policy_start_year',
    'week_number', 
    'chengdu_branch',
    'third_level_organization',
    'business_type_category',
    'insurance_type',
    'channel_category',
    'channel_subcategory',
    'sales_channel',
    'policy_holder_type',
    'policy_holder_nature',
    'vehicle_usage',
    'vehicle_type',
    'vehicle_brand',
    'vehicle_series',
    'displacement_range',
    'new_car_purchase_price_range'
  ] as const,

  business_type_category: [
    '10吨以上-普货',
    '10吨以上-牵引',
    '2-9吨营业货车',
    '2吨以下营业货车',
    '9-10吨营业货车',
    '其他',
    '出租车',
    '摩托车',
    '特种车',
    '网约车',
    '自卸',
    '非营业客车新车',
    '非营业客车旧车过户车',
    '非营业客车旧车非过户',
    '非营业货车新车',
    '非营业货车旧车'
  ],
  
  chengdu_branch: ['中支', '成都'],
  
  third_level_organization: [
    '乐山', '天府', '宜宾', '德阳', '新都', 
    '本部', '武侯', '泸州', '自贡', '资阳', 
    '达州', '青羊', '高新'
  ],
  
  customer_category_3: [
    '挂车', '摩托车', '特种车', '营业公路客运',
    '营业出租租赁', '营业城市公交', '营业货车',
    '非营业个人客车', '非营业企业客车', 
    '非营业机关客车', '非营业货车'
  ],
  
  insurance_type: ['交强险', '商业保险'],
  
  coverage_type: ['主全', '交三', '单交'],
  
  renewal_status: ['新保', '续保', '转保'],
  
  vehicle_insurance_grade: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'X'],
  
  highway_risk_grade: ['A', 'B', 'C', 'D', 'E', 'X'],
  
  large_truck_score: ['A', 'B', 'C', 'D', 'E', 'X'],
  
  small_truck_score: ['A', 'B', 'C', 'D', 'E', 'X'],
  
  terminal_source: [
    '0101柜面',
    '0105微信（WeChat）',
    '0106移动展业(App)',
    '0107B2B',
    '0110融合销售',
    '0201PC',
    '0202APP'
  ],
  
  policy_start_year: [2024, 2025],
  
  week_number: [28, 29, 30, 31, 33, 34, 35, 36] // 注：缺第32周
};

// 导出筛选维度数组
export const FILTER_DIMENSIONS = FIELD_OPTIONS.filterDimensions;

// 字段显示名称映射
export const DISPLAY_NAMES = {
  // 时间维度
  policy_start_year: '起保年度',
  week_number: '周序号',
  snapshot_date: '数据快照日期',
  
  // 机构维度
  chengdu_branch: '机构层级',
  third_level_organization: '三级机构/城市',
  
  // 业务维度
  business_type_category: '业务类型分类',
  customer_category_3: '客户三级分类',
  insurance_type: '险种类型',
  coverage_type: '险别组合',
  renewal_status: '新续转状态',
  terminal_source: '终端来源',
  
  // 车辆属性维度
  is_new_energy_vehicle: '是否新能源车',
  is_transferred_vehicle: '是否过户车',
  
  // 风险评级维度
  vehicle_insurance_grade: '车险分等级',
  highway_risk_grade: '高速风险等级',
  large_truck_score: '大货车评分',
  small_truck_score: '小货车评分',
  
  // 绝对值字段
  signed_premium_yuan: '签单保费（元）',
  matured_premium_yuan: '满期保费（元）',
  commercial_premium_before_discount_yuan: '商业险折前保费（元）',
  policy_count: '保单件数',
  claim_case_count: '赔案件数',
  reported_claim_payment_yuan: '已报告赔款（元）',
  expense_amount_yuan: '费用金额（元）',
  matured_margin_contribution_yuan: '满期边际贡献额（元）',
  variable_cost_amount_yuan: '变动成本金额（元）',
  
  // 计算字段
  average_premium_per_policy_yuan: '单均保费（元/件）',
  average_claim_payment_yuan: '案均赔款（元/件）',
  claim_frequency_percent: '满期出险率（%）',
  expired_loss_ratio_percent: '满期赔付率（%）',
  expense_ratio_percent: '费用率（%）',
  variable_cost_ratio_percent: '变动成本率（%）',
  matured_margin_contribution_rate_percent: '满期边际贡献率（%）',
  commercial_auto_underwriting_factor: '商业险自主定价系数',
  combined_ratio_percent: '综合成本率（%）',
  profit_margin_percent: '利润率（%）'
} as const;

// 字段分组定义
export const FIELD_GROUPS = {
  time: {
    label: '时间维度',
    fields: ['policy_start_year', 'week_number', 'snapshot_date']
  },
  organization: {
    label: '机构维度',
    fields: ['chengdu_branch', 'third_level_organization']
  },
  business: {
    label: '业务维度',
    fields: ['business_type_category', 'customer_category_3', 'insurance_type', 
             'coverage_type', 'renewal_status', 'terminal_source']
  },
  vehicle: {
    label: '车辆属性',
    fields: ['is_new_energy_vehicle', 'is_transferred_vehicle']
  },
  risk: {
    label: '风险评级',
    fields: ['vehicle_insurance_grade', 'highway_risk_grade', 
             'large_truck_score', 'small_truck_score']
  },
  premium: {
    label: '保费指标',
    fields: ['signed_premium_yuan', 'matured_premium_yuan', 
             'commercial_premium_before_discount_yuan', 'average_premium_per_policy_yuan']
  },
  claims: {
    label: '赔付指标',
    fields: ['reported_claim_payment_yuan', 'claim_case_count', 
             'average_claim_payment_yuan', 'claim_frequency_percent', 'expired_loss_ratio_percent']
  },
  costs: {
    label: '成本指标',
    fields: ['expense_amount_yuan', 'variable_cost_amount_yuan', 
             'expense_ratio_percent', 'variable_cost_ratio_percent']
  },
  profitability: {
    label: '盈利指标',
    fields: ['matured_margin_contribution_yuan', 'matured_margin_contribution_rate_percent',
             'combined_ratio_percent', 'profit_margin_percent']
  }
} as const;

// 图表类型配置
export const CHART_TYPES = {
  bar: { label: '柱状图', icon: 'BarChart3' },
  line: { label: '折线图', icon: 'LineChart' },
  pie: { label: '饼图', icon: 'PieChart' },
  area: { label: '面积图', icon: 'AreaChart' },
  scatter: { label: '散点图', icon: 'Scatter' }
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  pageSize: 1000,
  maxRecords: 50000,
  cacheTimeout: 300000, // 5分钟
  performanceThreshold: 2000, // 2秒
  defaultTimeRange: {
    startYear: 2024,
    endYear: 2025,
    startWeek: 28,
    endWeek: 36
  }
} as const;

// CSV文件字段映射（用于数据导入）
export const CSV_FIELD_MAPPING = {
  '业务类型分类': 'business_type_category',
  '机构层级': 'chengdu_branch',
  '三级机构': 'third_level_organization',
  '客户三级分类': 'customer_category_3',
  '险种类型': 'insurance_type',
  '是否新能源车': 'is_new_energy_vehicle',
  '险别组合': 'coverage_type',
  '是否过户车': 'is_transferred_vehicle',
  '新续转状态': 'renewal_status',
  '车险分等级': 'vehicle_insurance_grade',
  '高速风险等级': 'highway_risk_grade',
  '大货车评分': 'large_truck_score',
  '小货车评分': 'small_truck_score',
  '终端来源': 'terminal_source',
  '起保年度': 'policy_start_year',
  '周序号': 'week_number',
  '数据快照日期': 'snapshot_date',
  '签单保费': 'signed_premium_yuan',
  '满期保费': 'matured_premium_yuan',
  '商业险折前保费': 'commercial_premium_before_discount_yuan',
  '保单件数': 'policy_count',
  '赔案件数': 'claim_case_count',
  '已报告赔款': 'reported_claim_payment_yuan',
  '费用金额': 'expense_amount_yuan',
  '满期边际贡献额': 'matured_margin_contribution_yuan',
  '变动成本金额': 'variable_cost_amount_yuan'
} as const;

// 数据验证规则
export const VALIDATION_RULES = {
  required: ['policy_start_year', 'week_number', 'policy_count'],
  numeric: [
    'policy_start_year', 'week_number', 'signed_premium_yuan', 
    'matured_premium_yuan', 'commercial_premium_before_discount_yuan',
    'policy_count', 'claim_case_count', 'reported_claim_payment_yuan',
    'expense_amount_yuan', 'matured_margin_contribution_yuan', 'variable_cost_amount_yuan'
  ],
  boolean: ['is_new_energy_vehicle', 'is_transferred_vehicle'],
  ranges: {
    policy_start_year: { min: 2020, max: 2030 },
    week_number: { min: 1, max: 53 },
    policy_count: { min: 0, max: 999999 }
  }
} as const;
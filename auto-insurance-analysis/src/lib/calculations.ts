/**
 * 车险多维分析系统 - 指标计算引擎
 * 实现所有计算字段的公式和聚合逻辑
 */

import { AbsoluteValueFields, CalculatedFields, AnalysisResult, InsuranceRecord } from '@/types/insurance';

/**
 * 计算单条记录的所有计算字段
 * @param record 包含绝对值字段的记录
 * @returns 计算后的字段值
 */
export function calculateFields(record: AbsoluteValueFields): CalculatedFields {
  const {
    signed_premium_yuan,
    matured_premium_yuan,
    commercial_premium_before_discount_yuan,
    policy_count,
    claim_case_count,
    reported_claim_payment_yuan,
    expense_amount_yuan,
    matured_margin_contribution_yuan,
    variable_cost_amount_yuan
  } = record;

  // 平均值类计算
  const average_premium_per_policy_yuan = policy_count > 0 
    ? signed_premium_yuan / policy_count 
    : 0;

  const average_claim_payment_yuan = claim_case_count > 0 
    ? reported_claim_payment_yuan / claim_case_count 
    : 0;

  // 比率类计算（百分比）
  const claim_frequency_percent = policy_count > 0 
    ? (claim_case_count / policy_count) * 100 
    : 0;

  const expired_loss_ratio_percent = matured_premium_yuan > 0 
    ? (reported_claim_payment_yuan / matured_premium_yuan) * 100 
    : 0;

  const expense_ratio_percent = signed_premium_yuan > 0 
    ? (expense_amount_yuan / signed_premium_yuan) * 100 
    : 0;

  const variable_cost_ratio_percent = signed_premium_yuan > 0 
    ? (variable_cost_amount_yuan / signed_premium_yuan) * 100 
    : 0;

  const matured_margin_contribution_rate_percent = matured_premium_yuan > 0 
    ? (matured_margin_contribution_yuan / matured_premium_yuan) * 100 
    : 0;

  // 系数类计算
  const commercial_auto_underwriting_factor = commercial_premium_before_discount_yuan > 0 
    ? signed_premium_yuan / commercial_premium_before_discount_yuan 
    : 0;

  // 综合指标计算
  const combined_ratio_percent = expired_loss_ratio_percent + expense_ratio_percent;
  
  const profit_margin_percent = 100 - combined_ratio_percent;

  return {
    average_premium_per_policy_yuan,
    average_claim_payment_yuan,
    claim_frequency_percent,
    expired_loss_ratio_percent,
    expense_ratio_percent,
    variable_cost_ratio_percent,
    matured_margin_contribution_rate_percent,
    commercial_auto_underwriting_factor,
    combined_ratio_percent,
    profit_margin_percent
  };
}

/**
 * 聚合多条记录的绝对值字段
 * @param records 记录数组
 * @returns 聚合后的绝对值字段
 */
export function aggregateAbsoluteFields(records: AbsoluteValueFields[]): AbsoluteValueFields {
  if (records.length === 0) {
    return {
      signed_premium_yuan: 0,
      matured_premium_yuan: 0,
      commercial_premium_before_discount_yuan: 0,
      policy_count: 0,
      claim_case_count: 0,
      reported_claim_payment_yuan: 0,
      expense_amount_yuan: 0,
      matured_margin_contribution_yuan: 0,
      variable_cost_amount_yuan: 0
    };
  }

  return records.reduce((acc, record) => ({
    signed_premium_yuan: acc.signed_premium_yuan + record.signed_premium_yuan,
    matured_premium_yuan: acc.matured_premium_yuan + record.matured_premium_yuan,
    commercial_premium_before_discount_yuan: acc.commercial_premium_before_discount_yuan + record.commercial_premium_before_discount_yuan,
    policy_count: acc.policy_count + record.policy_count,
    claim_case_count: acc.claim_case_count + record.claim_case_count,
    reported_claim_payment_yuan: acc.reported_claim_payment_yuan + record.reported_claim_payment_yuan,
    expense_amount_yuan: acc.expense_amount_yuan + record.expense_amount_yuan,
    matured_margin_contribution_yuan: acc.matured_margin_contribution_yuan + record.matured_margin_contribution_yuan,
    variable_cost_amount_yuan: acc.variable_cost_amount_yuan + record.variable_cost_amount_yuan
  }), {
    signed_premium_yuan: 0,
    matured_premium_yuan: 0,
    commercial_premium_before_discount_yuan: 0,
    policy_count: 0,
    claim_case_count: 0,
    reported_claim_payment_yuan: 0,
    expense_amount_yuan: 0,
    matured_margin_contribution_yuan: 0,
    variable_cost_amount_yuan: 0
  });
}

/**
 * 计算完整的分析结果
 * @param records 原始记录数组
 * @param dimensions 聚合维度
 * @returns 完整的分析结果
 */
export function calculateAnalysisResult(
  records: InsuranceRecord[], 
  dimensions: any = {}
): AnalysisResult {
  // 聚合绝对值字段
  const aggregatedAbsolute = aggregateAbsoluteFields(records);
  
  // 计算派生字段
  const calculatedFields = calculateFields(aggregatedAbsolute);
  
  return {
    ...aggregatedAbsolute,
    ...calculatedFields,
    dimensions,
    record_count: records.length
  };
}

/**
 * 按维度分组并计算分析结果
 * @param records 原始记录数组
 * @param groupByFields 分组字段
 * @returns 分组后的分析结果数组
 */
export function groupByAndCalculate(
  records: InsuranceRecord[], 
  groupByFields: (keyof InsuranceRecord)[]
): AnalysisResult[] {
  if (groupByFields.length === 0) {
    return [calculateAnalysisResult(records)];
  }

  // 创建分组映射
  const groups = new Map<string, InsuranceRecord[]>();
  
  records.forEach(record => {
    // 创建分组键
    const groupKey = groupByFields
      .map(field => String(record[field] ?? 'null'))
      .join('|');
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(record);
  });

  // 计算每个分组的结果
  return Array.from(groups.entries()).map(([groupKey, groupRecords]) => {
    // 解析分组维度
    const dimensionValues = groupKey.split('|');
    const dimensions: any = {};
    
    groupByFields.forEach((field, index) => {
      const value = dimensionValues[index];
      dimensions[field] = value === 'null' ? null : 
        (typeof groupRecords[0][field] === 'number' ? Number(value) : 
         value === 'true' ? true : 
         value === 'false' ? false : value);
    });

    return calculateAnalysisResult(groupRecords, dimensions);
  });
}

/**
 * 数据质量检查
 * @param record 待检查的记录
 * @returns 检查结果
 */
export function validateRecord(record: Partial<InsuranceRecord>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必填字段检查
  if (!record.policy_start_year) {
    errors.push('起保年度不能为空');
  }
  if (!record.week_number) {
    errors.push('周序号不能为空');
  }
  if (!record.policy_count || record.policy_count <= 0) {
    errors.push('保单件数必须大于0');
  }

  // 数值范围检查
  if (record.policy_start_year && (record.policy_start_year < 2020 || record.policy_start_year > 2030)) {
    errors.push('起保年度超出合理范围(2020-2030)');
  }
  if (record.week_number && (record.week_number < 1 || record.week_number > 53)) {
    errors.push('周序号超出合理范围(1-53)');
  }

  // 逻辑一致性检查
  if (record.signed_premium_yuan && record.signed_premium_yuan < 0) {
    errors.push('签单保费不能为负数');
  }
  if (record.matured_premium_yuan && record.matured_premium_yuan < 0) {
    errors.push('满期保费不能为负数');
  }
  if (record.reported_claim_payment_yuan && record.reported_claim_payment_yuan < 0) {
    errors.push('已报告赔款不能为负数');
  }

  // 业务逻辑警告
  if (record.claim_case_count && record.policy_count && 
      record.claim_case_count > record.policy_count) {
    warnings.push('赔案件数超过保单件数，请检查数据准确性');
  }

  if (record.matured_premium_yuan && record.signed_premium_yuan &&
      Math.abs(record.matured_premium_yuan - record.signed_premium_yuan) / record.signed_premium_yuan > 0.5) {
    warnings.push('满期保费与签单保费差异较大，请检查数据准确性');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 格式化数值显示
 * @param value 数值
 * @param type 数值类型
 * @returns 格式化后的字符串
 */
export function formatValue(value: number, type: 'currency' | 'percentage' | 'count' | 'ratio'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(2)}%`;
    
    case 'count':
      return new Intl.NumberFormat('zh-CN').format(Math.round(value));
    
    case 'ratio':
      return value.toFixed(4);
    
    default:
      return value.toString();
  }
}

/**
 * 计算同比增长率
 * @param current 当前值
 * @param previous 上期值
 * @returns 增长率（百分比）
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * 计算移动平均
 * @param values 数值数组
 * @param window 窗口大小
 * @returns 移动平均数组
 */
export function calculateMovingAverage(values: number[], window: number): number[] {
  if (values.length < window) return values;
  
  const result: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  
  return result;
}
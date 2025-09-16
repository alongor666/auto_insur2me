/**
 * 车险变动成本多维分析系统 - 指标计算引擎
 * 
 * 功能说明：
 * - 实现核心指标的计算逻辑（绝对值字段聚合 + 计算字段推导）
 * - 支持按维度聚合计算
 * - 包含完整的除零处理和异常检测
 * - 遵循PRD和数据规范的计算公式
 */

import { 
  InsuranceRecord, 
  CalculatedFields, 
  AbsoluteValueFields, 
  FilterDimensions,
  AnalysisResult
} from '@/types/insurance';

/**
 * 聚合数据接口 - 包含维度信息和聚合后的绝对值字段
 */
export interface AggregatedData {
  // 维度信息
  dimensions: Partial<FilterDimensions>;
  
  // 聚合后的绝对值字段（基于现有类型定义）
  signed_premium_yuan: number;
  matured_premium_yuan: number;
  commercial_premium_before_discount_yuan: number;
  policy_count: number;
  claim_case_count: number;
  reported_claim_payment_yuan: number;
  expense_amount_yuan: number;
  matured_margin_contribution_yuan: number;
  variable_cost_amount_yuan: number;
  
  // 记录数量
  record_count: number;
}

/**
 * 计算结果接口 - 包含所有指标和质量信息
 */
export interface MetricCalculationResult extends AggregatedData {
  // 计算字段（基于现有类型定义）
  average_premium_per_policy_yuan: number;
  average_claim_payment_yuan: number;
  claim_frequency_percent: number;
  expired_loss_ratio_percent: number;
  expense_ratio_percent: number;
  variable_cost_ratio_percent: number;
  matured_margin_contribution_rate_percent: number;
  commercial_auto_underwriting_factor: number;
  combined_ratio_percent: number;
  profit_margin_percent: number;
  
  // 数据质量标识
  data_quality_score?: number;
  anomaly_flags?: string[];
  calculation_warnings?: string[];
}

/**
 * 异常检测阈值配置
 */
export const ANOMALY_THRESHOLDS = {
  // 变动成本率异常范围
  variable_cost_ratio: { min: 0, max: 150 },
  // 满期赔付率异常范围
  expired_loss_ratio: { min: 0, max: 100 },
  // 费用率异常范围
  expense_ratio: { min: 0, max: 50 },
  // 边际贡献率异常范围
  margin_contribution_ratio: { min: -50, max: 100 }
};

/**
 * 指标计算引擎类
 */
export class MetricCalculator {
  
  /**
   * 按指定维度聚合原始数据
   * @param data 原始保险记录数组
   * @param groupByFields 分组维度字段数组
   * @returns 聚合后的数据数组
   */
  public static aggregateByDimensions(
    data: InsuranceRecord[], 
    groupByFields: (keyof FilterDimensions)[] = []
  ): AggregatedData[] {
    if (!data || data.length === 0) {
      return [];
    }

    // 如果没有指定分组字段，则对所有数据进行全局聚合
    if (groupByFields.length === 0) {
      return [this.aggregateGroup(data, {})];
    }

    // 按指定维度分组
    const groups = new Map<string, InsuranceRecord[]>();
    
    data.forEach(record => {
      // 生成分组键
      const groupKey = groupByFields
        .map(field => `${field}:${record[field] || 'null'}`)
        .join('|');
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(record);
    });

    // 对每个分组进行聚合计算
    const results: AggregatedData[] = [];
    
    groups.forEach((groupData, groupKey) => {
      // 提取分组维度值
      const dimensionValues: Partial<FilterDimensions> = {};
      groupByFields.forEach(field => {
        dimensionValues[field] = groupData[0][field] as any;
      });
      
      const aggregated = this.aggregateGroup(groupData, dimensionValues);
      results.push(aggregated);
    });

    return results;
  }

  /**
   * 对单个分组进行聚合计算
   * @param groupData 分组内的数据
   * @param dimensionValues 维度值
   * @returns 聚合结果
   */
  private static aggregateGroup(
    groupData: InsuranceRecord[], 
    dimensionValues: Partial<FilterDimensions>
  ): AggregatedData {
    
    // 聚合绝对值字段
    const aggregated: AggregatedData = {
      dimensions: dimensionValues,
      record_count: groupData.length,
      signed_premium_yuan: this.safeSum(groupData, 'signed_premium_yuan'),
      matured_premium_yuan: this.safeSum(groupData, 'matured_premium_yuan'),
      commercial_premium_before_discount_yuan: this.safeSum(groupData, 'commercial_premium_before_discount_yuan'),
      policy_count: this.safeSum(groupData, 'policy_count'),
      claim_case_count: this.safeSum(groupData, 'claim_case_count'),
      reported_claim_payment_yuan: this.safeSum(groupData, 'reported_claim_payment_yuan'),
      expense_amount_yuan: this.safeSum(groupData, 'expense_amount_yuan'),
      matured_margin_contribution_yuan: this.safeSum(groupData, 'matured_margin_contribution_yuan'),
      variable_cost_amount_yuan: this.safeSum(groupData, 'variable_cost_amount_yuan')
    };

    return aggregated;
  }

  /**
   * 安全求和函数 - 处理null/undefined值
   * @param data 数据数组
   * @param field 字段名
   * @returns 求和结果
   */
  private static safeSum(data: InsuranceRecord[], field: keyof AbsoluteValueFields): number {
    return data.reduce((sum, record) => {
      const value = record[field] as number;
      return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
    }, 0);
  }

  /**
   * 计算所有指标 - 基于聚合数据计算核心指标
   * @param aggregatedData 聚合后的数据
   * @returns 完整的指标计算结果
   */
  public static calculateMetrics(aggregatedData: AggregatedData): MetricCalculationResult {
    const warnings: string[] = [];
    const anomalyFlags: string[] = [];

    // 计算均值字段
    const average_premium_per_policy_yuan = this.safeDivide(
      aggregatedData.signed_premium_yuan, 
      aggregatedData.policy_count, 
      '单均保费计算：保单件数为0', 
      warnings
    );

    const average_claim_payment_yuan = this.safeDivide(
      aggregatedData.reported_claim_payment_yuan, 
      aggregatedData.claim_case_count, 
      '案均赔款计算：赔案件数为0', 
      warnings
    );

    // 计算率值字段
    const expense_ratio_percent = this.safeDivide(
      aggregatedData.expense_amount_yuan, 
      aggregatedData.signed_premium_yuan, 
      '费用率计算：签单保费为0', 
      warnings
    ) * 100;

    const expired_loss_ratio_percent = this.safeDivide(
      aggregatedData.reported_claim_payment_yuan, 
      aggregatedData.matured_premium_yuan, 
      '满期赔付率计算：满期保费为0', 
      warnings
    ) * 100;

    const claim_frequency_percent = this.safeDivide(
      aggregatedData.claim_case_count, 
      aggregatedData.policy_count, 
      '满期出险率计算：保单件数为0', 
      warnings
    ) * this.safeDivide(
      aggregatedData.matured_premium_yuan, 
      aggregatedData.signed_premium_yuan, 
      '满期出险率计算：签单保费为0', 
      warnings
    ) * 100;

    const variable_cost_ratio_percent = (
      this.safeDivide(aggregatedData.expense_amount_yuan, aggregatedData.signed_premium_yuan, '', warnings) +
      this.safeDivide(aggregatedData.reported_claim_payment_yuan, aggregatedData.matured_premium_yuan, '', warnings)
    ) * 100;

    const matured_margin_contribution_rate_percent = this.safeDivide(
      aggregatedData.matured_margin_contribution_yuan, 
      aggregatedData.matured_premium_yuan, 
      '边际贡献率计算：满期保费为0', 
      warnings
    ) * 100;

    // 计算系数字段
    const commercial_auto_underwriting_factor = this.safeDivide(
      aggregatedData.signed_premium_yuan, 
      aggregatedData.commercial_premium_before_discount_yuan, 
      '商业险自主系数计算：商业险折前保费为0', 
      warnings
    );

    // 计算其他字段
    const combined_ratio_percent = expense_ratio_percent + expired_loss_ratio_percent;
    const profit_margin_percent = 100 - combined_ratio_percent;

    // 合并所有计算结果
    const result: MetricCalculationResult = {
      ...aggregatedData,
      average_premium_per_policy_yuan: Math.round(average_premium_per_policy_yuan),
      average_claim_payment_yuan: Math.round(average_claim_payment_yuan),
      claim_frequency_percent: this.roundToDecimal(claim_frequency_percent, 1),
      expired_loss_ratio_percent: this.roundToDecimal(expired_loss_ratio_percent, 1),
      expense_ratio_percent: this.roundToDecimal(expense_ratio_percent, 1),
      variable_cost_ratio_percent: this.roundToDecimal(variable_cost_ratio_percent, 1),
      matured_margin_contribution_rate_percent: this.roundToDecimal(matured_margin_contribution_rate_percent, 1),
      commercial_auto_underwriting_factor: this.roundToDecimal(commercial_auto_underwriting_factor, 4),
      combined_ratio_percent: this.roundToDecimal(combined_ratio_percent, 1),
      profit_margin_percent: this.roundToDecimal(profit_margin_percent, 1),
      calculation_warnings: warnings,
      anomaly_flags: anomalyFlags
    };

    // 执行异常检测
    this.detectAnomalies(result, anomalyFlags);
    
    // 计算数据质量评分
    result.data_quality_score = this.calculateDataQualityScore(result);

    return result;
  }

  /**
   * 安全除法 - 处理除零情况
   * @param numerator 分子
   * @param denominator 分母
   * @param warningMessage 警告信息
   * @param warnings 警告数组
   * @returns 计算结果
   */
  private static safeDivide(
    numerator: number, 
    denominator: number, 
    warningMessage: string, 
    warnings: string[]
  ): number {
    if (denominator === 0 || denominator === null || denominator === undefined) {
      if (warningMessage) {
        warnings.push(warningMessage);
      }
      return 0;
    }
    return numerator / denominator;
  }

  /**
   * 数值四舍五入到指定小数位
   * @param value 数值
   * @param decimals 小数位数
   * @returns 四舍五入后的数值
   */
  private static roundToDecimal(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * 异常检测
   * @param result 计算结果
   * @param anomalyFlags 异常标识数组
   */
  private static detectAnomalies(result: MetricCalculationResult, anomalyFlags: string[]): void {
    // 检测变动成本率异常
    if (result.variable_cost_ratio_percent < ANOMALY_THRESHOLDS.variable_cost_ratio.min || 
        result.variable_cost_ratio_percent > ANOMALY_THRESHOLDS.variable_cost_ratio.max) {
      anomalyFlags.push(`变动成本率异常: ${result.variable_cost_ratio_percent}%`);
    }

    // 检测满期赔付率异常
    if (result.expired_loss_ratio_percent < ANOMALY_THRESHOLDS.expired_loss_ratio.min || 
        result.expired_loss_ratio_percent > ANOMALY_THRESHOLDS.expired_loss_ratio.max) {
      anomalyFlags.push(`满期赔付率异常: ${result.expired_loss_ratio_percent}%`);
    }

    // 检测费用率异常
    if (result.expense_ratio_percent < ANOMALY_THRESHOLDS.expense_ratio.min || 
        result.expense_ratio_percent > ANOMALY_THRESHOLDS.expense_ratio.max) {
      anomalyFlags.push(`费用率异常: ${result.expense_ratio_percent}%`);
    }

    // 检测边际贡献率异常
    if (result.matured_margin_contribution_rate_percent < ANOMALY_THRESHOLDS.margin_contribution_ratio.min || 
        result.matured_margin_contribution_rate_percent > ANOMALY_THRESHOLDS.margin_contribution_ratio.max) {
      anomalyFlags.push(`边际贡献率异常: ${result.matured_margin_contribution_rate_percent}%`);
    }
  }

  /**
   * 计算数据质量评分
   * @param result 计算结果
   * @returns 数据质量评分 (0-100)
   */
  private static calculateDataQualityScore(result: MetricCalculationResult): number {
    let score = 100;
    
    // 根据警告数量扣分
    score -= (result.calculation_warnings?.length || 0) * 10;
    
    // 根据异常数量扣分
    score -= (result.anomaly_flags?.length || 0) * 15;
    
    // 检查关键字段完整性
    if (result.signed_premium_yuan === 0) score -= 20;
    if (result.matured_premium_yuan === 0) score -= 15;
    if (result.policy_count === 0) score -= 25;
    
    return Math.max(0, Math.min(100, score));
  }
}

/**
 * 导出便捷函数
 */

/**
 * 快速计算单组数据的所有指标
 * @param data 原始数据数组
 * @returns 计算结果
 */
export function calculateAllMetrics(data: InsuranceRecord[]): MetricCalculationResult {
  const aggregated = MetricCalculator.aggregateByDimensions(data, []);
  return MetricCalculator.calculateMetrics(aggregated[0]);
}

/**
 * 按维度分组计算指标
 * @param data 原始数据数组
 * @param dimensions 分组维度
 * @returns 分组计算结果数组
 */
export function calculateMetricsByDimensions(
  data: InsuranceRecord[], 
  dimensions: (keyof FilterDimensions)[]
): MetricCalculationResult[] {
  const aggregatedGroups = MetricCalculator.aggregateByDimensions(data, dimensions);
  return aggregatedGroups.map(group => MetricCalculator.calculateMetrics(group));
}
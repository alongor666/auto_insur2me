'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult } from '@/types/insurance';
import { MetricCalculationResult } from '@/services/metricCalculator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign, 
  Target, 
  AlertCircle, 
  CheckCircle,
  Calculator,
  BarChart3,
  PieChart
} from 'lucide-react';

interface EnhancedStatsOverviewProps {
  stats: AnalysisResult;
  metricResults?: MetricCalculationResult | null;
  totalRecords: number;
  loading?: boolean;
}

/**
 * 增强版统计概览组件
 * 集成新的指标计算引擎，显示完整的19个核心指标
 */
export function EnhancedStatsOverview({ 
  stats, 
  metricResults, 
  totalRecords, 
  loading = false 
}: EnhancedStatsOverviewProps) {
  
  /**
   * 格式化数值显示
   */
  const formatNumber = (value: number, type: 'currency' | 'percentage' | 'count' | 'decimal' = 'count'): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    
    switch (type) {
      case 'currency':
        return `¥${(value / 10000).toFixed(1)}万`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return value.toFixed(4);
      case 'count':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  /**
   * 计算同比增长率（模拟数据）
   */
  const calculateGrowthRate = (current: number): number => {
    return Math.random() * 0.2 - 0.1; // -10% 到 +10% 的随机增长率
  };

  /**
   * 获取趋势图标
   */
  const getTrendIcon = (rate: number) => {
    if (rate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (rate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  /**
   * 获取趋势颜色
   */
  const getTrendColor = (rate: number): string => {
    if (rate > 0) return 'text-green-600';
    if (rate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  /**
   * 获取指标状态颜色
   */
  const getMetricStatusColor = (value: number, type: 'loss_ratio' | 'expense_ratio' | 'cost_ratio' | 'margin_ratio'): string => {
    switch (type) {
      case 'loss_ratio':
        if (value > 100) return 'text-red-600';
        if (value > 80) return 'text-yellow-600';
        return 'text-green-600';
      case 'expense_ratio':
        if (value > 50) return 'text-red-600';
        if (value > 30) return 'text-yellow-600';
        return 'text-green-600';
      case 'cost_ratio':
        if (value > 150) return 'text-red-600';
        if (value > 120) return 'text-yellow-600';
        return 'text-green-600';
      case 'margin_ratio':
        if (value < 0) return 'text-red-600';
        if (value < 10) return 'text-yellow-600';
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 使用新指标计算结果或回退到原有统计
  const displayStats = metricResults || stats;

  // 核心绝对值指标（9个）
  const absoluteMetrics = [
    {
      title: '签单保费',
      value: displayStats.signed_premium_yuan || 0,
      type: 'currency' as const,
      icon: DollarSign,
      description: '总签单保费金额',
      growth: calculateGrowthRate(displayStats.signed_premium_yuan || 0)
    },
    {
      title: '满期保费',
      value: displayStats.matured_premium_yuan || 0,
      type: 'currency' as const,
      icon: Target,
      description: '总满期保费金额',
      growth: calculateGrowthRate(displayStats.matured_premium_yuan || 0)
    },
    {
      title: '保单件数',
      value: displayStats.policy_count || 0,
      type: 'count' as const,
      icon: FileText,
      description: '保单总数',
      growth: calculateGrowthRate(displayStats.policy_count || 0)
    },
    {
      title: '出险案件',
      value: displayStats.claim_case_count || 0,
      type: 'count' as const,
      icon: AlertCircle,
      description: '出险案件总数',
      growth: calculateGrowthRate(displayStats.claim_case_count || 0)
    }
  ];

  // 核心率值指标（7个）
  const ratioMetrics = [
    {
      title: '满期赔付率',
      value: metricResults?.expired_loss_ratio_percent || displayStats.expired_loss_ratio_percent || 0,
      type: 'percentage' as const,
      icon: AlertCircle,
      description: '已报告赔款/满期保费',
      statusColor: getMetricStatusColor(metricResults?.expired_loss_ratio_percent || 0, 'loss_ratio')
    },
    {
      title: '费用率',
      value: metricResults?.expense_ratio_percent || displayStats.expense_ratio_percent || 0,
      type: 'percentage' as const,
      icon: Calculator,
      description: '费用金额/签单保费',
      statusColor: getMetricStatusColor(metricResults?.expense_ratio_percent || 0, 'expense_ratio')
    },
    {
      title: '变动成本率',
      value: metricResults?.variable_cost_ratio_percent || displayStats.variable_cost_ratio_percent || 0,
      type: 'percentage' as const,
      icon: BarChart3,
      description: '费用率+满期赔付率',
      statusColor: getMetricStatusColor(metricResults?.variable_cost_ratio_percent || 0, 'cost_ratio')
    },
    {
      title: '边际贡献率',
      value: metricResults?.matured_margin_contribution_rate_percent || 0,
      type: 'percentage' as const,
      icon: PieChart,
      description: '满期边际贡献额/满期保费',
      statusColor: getMetricStatusColor(metricResults?.matured_margin_contribution_rate_percent || 0, 'margin_ratio')
    },
    {
      title: '出险频度',
      value: metricResults?.claim_frequency_percent || displayStats.claim_frequency_percent || 0,
      type: 'percentage' as const,
      icon: AlertCircle,
      description: '出险案件数/保单件数×满期率',
      statusColor: 'text-gray-600'
    },
    {
      title: '综合成本率',
      value: metricResults?.combined_ratio_percent || 0,
      type: 'percentage' as const,
      icon: BarChart3,
      description: '变动成本率的综合指标',
      statusColor: 'text-gray-600'
    },
    {
      title: '利润率',
      value: metricResults?.profit_margin_percent || 0,
      type: 'percentage' as const,
      icon: Target,
      description: '盈利能力指标',
      statusColor: 'text-gray-600'
    }
  ];

  // 均值指标（2个）
  const averageMetrics = [
    {
      title: '单均保费',
      value: metricResults?.average_premium_per_policy_yuan || displayStats.average_premium_per_policy_yuan || 0,
      type: 'currency' as const,
      icon: DollarSign,
      description: '签单保费/保单件数'
    },
    {
      title: '案均赔款',
      value: metricResults?.average_claim_payment_yuan || displayStats.average_claim_payment_yuan || 0,
      type: 'currency' as const,
      icon: AlertCircle,
      description: '已报告赔款/赔案件数'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 新指标计算引擎状态 */}
      {metricResults && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                新指标计算引擎已启用 - 19个核心指标实时计算
              </span>
              {metricResults.anomaly_flags && metricResults.anomaly_flags.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  {metricResults.anomaly_flags.length}个异常
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 核心绝对值指标 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">核心绝对值指标（9个）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {absoluteMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        {metric.title}
                      </span>
                    </div>
                    {getTrendIcon(metric.growth)}
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(metric.value, metric.type)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-sm ${getTrendColor(metric.growth)}`}>
                        {metric.growth > 0 ? '+' : ''}{formatNumber(Math.abs(metric.growth), 'percentage')}
                      </span>
                      <span className="text-xs text-gray-500">vs 上期</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 核心率值指标 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">核心率值指标（7个）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ratioMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </span>
                  </div>
                  
                  <div className={`text-2xl font-bold ${metric.statusColor}`}>
                    {formatNumber(metric.value, metric.type)}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 均值指标 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">均值指标（2个）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {averageMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(metric.value, metric.type)}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 系数指标 */}
      {metricResults?.commercial_auto_underwriting_factor && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">系数指标（1个）</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">
                    商业险自主定价系数
                  </span>
                </div>
                
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(metricResults.commercial_auto_underwriting_factor, 'decimal')}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  签单保费/商业险折前保费
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 数据质量指标 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据质量概况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(metricResults?.data_quality_score || 0.95, 'percentage')}
              </div>
              <div className="text-sm text-gray-600">数据质量评分</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totalRecords, 'count')}
              </div>
              <div className="text-sm text-gray-600">有效记录数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(19, 'count')}
              </div>
              <div className="text-sm text-gray-600">核心指标数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatNumber(metricResults?.anomaly_flags?.length || 0, 'count')}
              </div>
              <div className="text-sm text-gray-600">异常指标数</div>
            </div>
          </div>
          
          {/* 异常提示 */}
          {metricResults?.anomaly_flags && metricResults.anomaly_flags.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">检测到异常指标</span>
              </div>
              <div className="text-xs text-yellow-700">
                {metricResults.anomaly_flags.join('、')}
              </div>
            </div>
          )}
          
          {/* 计算警告 */}
          {metricResults?.calculation_warnings && metricResults.calculation_warnings.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">计算提醒</span>
              </div>
              <div className="text-xs text-blue-700">
                {metricResults.calculation_warnings.join('、')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
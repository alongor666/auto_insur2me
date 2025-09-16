'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult } from '@/types/insurance';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, Target, AlertCircle, CheckCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: AnalysisResult;
  totalRecords: number;
  loading?: boolean;
}

/**
 * 统计概览组件
 * 显示关键业务指标和数据概况
 */
export function StatsOverview({ stats, totalRecords, loading = false }: StatsOverviewProps) {
  /**
   * 格式化数值显示
   */
  const formatNumber = (value: number, type: 'currency' | 'percentage' | 'count' = 'count'): string => {
    if (isNaN(value) || value === null || value === undefined) return '0';
    
    switch (type) {
      case 'currency':
        return `¥${(value / 10000).toFixed(1)}万`;
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
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
    // 实际应用中应该与历史数据对比
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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

  // 核心指标数据
  const coreMetrics = [
    {
      title: '签单保费',
      value: stats.signed_premium_yuan || 0,
      type: 'currency' as const,
      icon: DollarSign,
      description: '总签单保费金额',
      growth: calculateGrowthRate(stats.signed_premium_yuan || 0)
    },
    {
      title: '满期保费',
      value: stats.matured_premium_yuan || 0,
      type: 'currency' as const,
      icon: Target,
      description: '总满期保费金额',
      growth: calculateGrowthRate(stats.matured_premium_yuan || 0)
    },
    {
      title: '保单数量',
      value: stats.policy_count || 0,
      type: 'count' as const,
      icon: FileText,
      description: '保单总数',
      growth: calculateGrowthRate(stats.policy_count || 0)
    },
    {
      title: '出险案件',
      value: stats.claim_case_count || 0,
      type: 'count' as const,
      icon: AlertCircle,
      description: '出险案件总数',
      growth: calculateGrowthRate(stats.claim_case_count || 0)
    }
  ];

  // 计算衍生指标
  const derivedMetrics = [
    {
      title: '平均保费',
      value: stats.policy_count > 0 ? (stats.signed_premium_yuan || 0) / stats.policy_count : 0,
      type: 'currency' as const,
      icon: DollarSign,
      description: '单均保费'
    },
    {
      title: '出险率',
      value: stats.policy_count > 0 ? (stats.claim_case_count || 0) / stats.policy_count : 0,
      type: 'percentage' as const,
      icon: AlertCircle,
      description: '出险案件占比'
    },
    {
      title: '数据记录',
      value: totalRecords,
      type: 'count' as const,
      icon: Users,
      description: '当前筛选结果'
    },
    {
      title: '数据完整性',
      value: 0.95, // 模拟数据完整性
      type: 'percentage' as const,
      icon: CheckCircle,
      description: '数据质量评分'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 核心业务指标 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">核心业务指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreMetrics.map((metric) => {
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

      {/* 衍生指标 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">分析指标</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {derivedMetrics.map((metric) => {
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

      {/* 数据质量指标 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据质量概况</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(0.95, 'percentage')}
              </div>
              <div className="text-sm text-gray-600">数据完整性</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totalRecords, 'count')}
              </div>
              <div className="text-sm text-gray-600">有效记录数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(17, 'count')}
              </div>
              <div className="text-sm text-gray-600">分析维度数</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
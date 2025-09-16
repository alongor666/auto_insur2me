'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult } from '@/types/insurance';
import { DISPLAY_NAMES } from '@/lib/constants';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Zap as ScatterIcon, Download } from 'lucide-react';

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

interface ChartContainerProps {
  data: AnalysisResult[];
  chartType?: ChartType;
  xField?: string;
  yField?: string;
  title?: string;
  loading?: boolean;
  interactive?: boolean;
  height?: number;
}

/**
 * 图表容器组件
 * 支持柱状图、折线图、饼图、散点图
 */
export function ChartContainer({
  data,
  chartType = 'bar',
  xField = 'dimensions',
  yField = 'signed_premium_yuan',
  title = '数据分析图表',
  loading = false,
  interactive = false,
  height = 400
}: ChartContainerProps) {
  const [currentChartType, setCurrentChartType] = useState<ChartType>(chartType);

  /**
   * 处理数据格式化
   */
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => {
      const result: any = {
        index,
        name: getDisplayName(item, xField),
        value: getFieldValue(item, yField),
        ...item
      };

      // 为饼图添加颜色
      if (currentChartType === 'pie') {
        result.fill = CHART_COLORS[index % CHART_COLORS.length];
      }

      return result;
    });
  }, [data, xField, yField, currentChartType]);

  /**
   * 获取显示名称
   */
  const getDisplayName = (item: AnalysisResult, field: string): string => {
    if (field.startsWith('dimensions.')) {
      const dimensionKey = field.replace('dimensions.', '');
      const value = item.dimensions[dimensionKey as keyof typeof item.dimensions];
      return String(value || '未知');
    }
    return String((item as any)[field] || '未知');
  };

  /**
   * 获取字段值
   */
  const getFieldValue = (item: AnalysisResult, field: string): number => {
    if (field.startsWith('dimensions.')) {
      const dimensionKey = field.replace('dimensions.', '');
      return Number(item.dimensions[dimensionKey as keyof typeof item.dimensions]) || 0;
    }
    return Number((item as any)[field]) || 0;
  };

  /**
   * 格式化数值显示
   */
  const formatValue = (value: number, field: string): string => {
    if (field.includes('premium') || field.includes('amount')) {
      return `¥${(value / 10000).toFixed(1)}万`;
    }
    if (field.includes('rate') || field.includes('ratio')) {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  /**
   * 自定义Tooltip
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatValue(entry.value, yField)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  /**
   * 导出图表数据
   */
  const exportChartData = () => {
    const csvContent = [
      ['名称', '数值'],
      ...chartData.map(item => [item.name, item.value])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  /**
   * 渲染图表
   */
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">加载中...</div>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">暂无数据</div>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (currentChartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tickFormatter={(value) => formatValue(value, yField)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#3B82F6" 
                name={DISPLAY_NAMES[yField as keyof typeof DISPLAY_NAMES] || yField}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatValue(value, yField)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name={DISPLAY_NAMES[yField as keyof typeof DISPLAY_NAMES] || yField}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 10)} // 限制显示前10项
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatValue(Number(value), yField)} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="index"
                name="序号"
              />
              <YAxis 
                type="number" 
                dataKey="value"
                name={DISPLAY_NAMES[yField as keyof typeof DISPLAY_NAMES] || yField}
                tickFormatter={(value) => formatValue(value, yField)}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={<CustomTooltip />}
              />
              <Scatter 
                name={DISPLAY_NAMES[yField as keyof typeof DISPLAY_NAMES] || yField}
                dataKey="value" 
                fill="#3B82F6" 
              />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // 图表类型选项
  const chartTypeOptions = [
    { type: 'bar' as ChartType, label: '柱状图', icon: BarChart3 },
    { type: 'line' as ChartType, label: '折线图', icon: LineChartIcon },
    { type: 'pie' as ChartType, label: '饼图', icon: PieChartIcon },
    { type: 'scatter' as ChartType, label: '散点图', icon: ScatterIcon },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {/* 图表类型切换 */}
            {interactive && (
              <div className="flex items-center gap-1 mr-4">
                {chartTypeOptions.map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant={currentChartType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentChartType(type)}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            )}
            
            {/* 导出按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportChartData}
              disabled={loading || !chartData.length}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {renderChart()}
        </div>
        
        {/* 数据统计信息 */}
        {!loading && chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            <div className="flex justify-between">
              <span>数据点数: {chartData.length}</span>
              <span>
                总计: {formatValue(
                  chartData.reduce((sum, item) => sum + item.value, 0),
                  yField
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 图表颜色配置
const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];
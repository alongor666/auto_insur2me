'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterPanel } from '@/components/filters/filter-panel';
import { ChartContainer } from '@/components/charts/chart-container';
import { DataTable } from '@/components/data-table/data-table';
import { CSVUploader } from '@/components/csv-uploader/CSVUploader';
import { DataDiscovery } from '@/components/data-discovery/DataDiscovery';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ExportButton } from '@/components/export/export-button';
import { FilterConditions, InsuranceRecord, AnalysisResult } from '@/types/insurance';
import { db } from '@/lib/database';
import { MetricCalculationResult } from '@/services/metricCalculator';
import { Upload, BarChart3, Table, Download, Settings, RefreshCw } from 'lucide-react';

/**
 * 仪表盘主布局组件
 * 整合所有功能模块：数据导入、筛选、图表、表格、导出
 */
export function DashboardLayout() {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'table' | 'import' | 'export'>('overview');
  const [filters, setFilters] = useState<FilterConditions>({});
  const [data, setData] = useState<InsuranceRecord[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [summaryStats, setSummaryStats] = useState<AnalysisResult | null>(null);
  const [metricResults, setMetricResults] = useState<MetricCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 页面配置
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);

  /**
   * 加载数据并计算指标
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 加载原始数据
      const result = await db.findByConditions(
        filters,
        undefined,
        'asc',
        currentPage,
        pageSize
      );

      if (result.data) {
        setData(result.data);
        setTotalRecords(result.total || 0);

        // 计算全局指标 - 使用现有方法
        const stats = await db.getSummaryStats(filters);
        setSummaryStats(stats);
        
        // 尝试使用新的指标计算引擎（如果可用）
        try {
          const { calculateAllMetrics } = await import('@/services/metricCalculator');
          const globalMetrics = calculateAllMetrics(result.data);
          if (globalMetrics) {
            setMetricResults(globalMetrics);
            console.log('新指标计算引擎已启用，计算结果:', globalMetrics);
          }
        } catch (importErr) {
          console.log('新指标计算引擎暂不可用，使用现有统计方法');
        }

        // 计算按维度分组的指标（用于图表）
        const analysisResults = await db.aggregateByDimensions(['third_level_organization'], filters, 20);
        setAnalysisResults(analysisResults);
      } else {
        setError('数据加载失败');
      }
    } catch (err) {
      console.error('数据加载错误:', err);
      setError(err instanceof Error ? err.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理筛选条件变化
   */
  const handleFiltersChange = (newFilters: FilterConditions) => {
    setFilters(newFilters);
    setCurrentPage(1); // 重置到第一页
  };

  /**
   * 处理数据导入成功
   */
  const handleDataImported = () => {
    loadData();
    setActiveTab('overview');
  };

  /**
   * 刷新数据
   */
  const refreshData = () => {
    db.clearCache();
    loadData();
  };

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [filters, currentPage, pageSize]);

  // 标签页配置
  const tabs = [
    { id: 'overview', label: '数据概览', icon: BarChart3 },
    { id: 'charts', label: '图表分析', icon: BarChart3 },
    { id: 'table', label: '数据表格', icon: Table },
    { id: 'import', label: '数据导入', icon: Upload },
    { id: 'export', label: '数据导出', icon: Download },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">车险多维分析系统</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* 左侧筛选面板 */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">筛选条件</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterPanel
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  loading={loading}
                />
              </CardContent>
            </Card>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1">
            {/* 标签页导航 */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* 标签页内容 */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* 统计概览 */}
                  {summaryStats && (
                    <StatsOverview 
                      stats={summaryStats} 
                      totalRecords={totalRecords}
                      loading={loading}
                    />
                  )}
                  
                  {/* 快速图表 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>机构业绩分析</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        data={analysisResults}
                        chartType="bar"
                        xField="dimensions.third_level_organization"
                        yField="signed_premium_yuan"
                        title="各机构签单保费"
                        loading={loading}
                      />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'charts' && (
                <ChartContainer
                  data={analysisResults}
                  chartType="bar"
                  xField="dimensions.third_level_organization"
                  yField="signed_premium_yuan"
                  title="多维度图表分析"
                  loading={loading}
                  interactive={true}
                />
              )}

              {activeTab === 'table' && (
                <Card>
                  <CardHeader>
                    <CardTitle>数据表格</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={data}
                      loading={loading}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalRecords={totalRecords}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  </CardContent>
                </Card>
              )}

              {activeTab === 'import' && (
                <div className="space-y-6">
                  {/* 数据发现 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>现有数据发现</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataDiscovery 
                        onDataLoad={(data, metadata) => {
                          console.log('数据加载完成:', { recordCount: data.length, metadata });
                          setData(data);
                          setTotalRecords(data.length);
                          setActiveTab('overview');
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* CSV上传 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>CSV文件上传</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CSVUploader 
                        onDataUpload={(data, filename) => {
                          console.log('文件上传完成:', { filename, recordCount: data.length });
                          setData(data);
                          setTotalRecords(data.length);
                          setActiveTab('overview');
                        }}
                        onError={(error) => {
                          console.error('上传错误:', error);
                          setError(error);
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'export' && (
                <Card>
                  <CardHeader>
                    <CardTitle>数据导出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExportButton
                      data={data}
                      filename="insurance_analysis_data"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
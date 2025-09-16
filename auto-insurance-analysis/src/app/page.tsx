import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

/**
 * 车险多维分析系统主页面
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            车险多维分析系统
          </h1>
          <p className="text-gray-600 mt-2">
            基于17个筛选维度和19个核心指标的车险数据分析平台
          </p>
        </div>
        
        <DashboardLayout />
      </div>
    </main>
  );
}

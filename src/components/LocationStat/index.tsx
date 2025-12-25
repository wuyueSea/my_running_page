import { useState } from 'react';
import YearStat from '@/components/YearStat';
import {
  CHINESE_LOCATION_INFO_MESSAGE_FIRST,
  CHINESE_LOCATION_INFO_MESSAGE_SECOND,
} from '@/utils/const';
import CitiesStat from './CitiesStat';
import LocationSummary from './LocationSummary';
import PeriodStat from './PeriodStat';
import PeriodStatDetail from './PeriodStatDetail';

interface ILocationStatProps {
  changeYear: (_year: string) => void;
  changeCity: (_city: string) => void;
  changeType: (_type: string) => void;
  changeTitle: (_title: string) => void;
}

const LocationStat = ({
                        changeYear,
                        changeCity,
                        changeType,
                        changeTitle,
                      }: ILocationStatProps) => {
  // 定义状态管理当前激活的标签（初始显示年份统计）
  const [activeTab, setActiveTab] = useState<'year' | 'cities' | 'periodDetail'>('year');

  return (
    <div className="w-full pb-16 lg:w-full lg:pr-16">
      <section className="pb-0">
        <p className="leading-relaxed">
          {CHINESE_LOCATION_INFO_MESSAGE_FIRST}.
          <br />
          {CHINESE_LOCATION_INFO_MESSAGE_SECOND}.
          <br />
          <br />
          Yesterday you said tomorrow.
        </p>
      </section>
      <hr />

      {/* 1. 保留原有组件 */}
      <LocationSummary />
      <PeriodStat onClick={changeType} />

      {/* 2. 切换按钮组（仅修改文字颜色为 var(--color-brand-button)） */}
      <div className="flex gap-3 my-4">
        <button
          onClick={() => setActiveTab('year')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'year'
              ? 'bg-[var(--color-brand)] text-[var(--color-brand-button)]' // 选中态：背景不变，文字改为指定变量
              : 'bg-gray-300 dark:bg-gray-600 text-[var(--color-brand-button)]' // 未选中态：背景不变，文字改为指定变量
            }`}
        >
          运动汇总
        </button>

        <button
          onClick={() => setActiveTab('cities')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'cities'
              ? 'bg-[var(--color-brand)] text-[var(--color-brand-button)]' // 选中态：背景不变，文字改为指定变量
              : 'bg-gray-300 dark:bg-gray-600 text-[var(--color-brand-button)]' // 未选中态：背景不变，文字改为指定变量
            }`}
        >
          城市统计
        </button>

        <button
          onClick={() => setActiveTab('periodDetail')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'periodDetail'
              ? 'bg-[var(--color-brand)] text-[var(--color-brand-button)]' // 选中态：背景不变，文字改为指定变量
              : 'bg-gray-300 dark:bg-gray-600 text-[var(--color-brand-button)]' // 未选中态：背景不变，文字改为指定变量
            }`}
        >
          城市详情统计
        </button>
      </div>

      {/* 3. 根据激活标签显示对应组件 */}
      {activeTab === 'year' && <YearStat year="全部" onClick={changeYear} />}
      {activeTab === 'cities' && <CitiesStat onClick={changeCity} />}
      {activeTab === 'periodDetail' && <PeriodStatDetail onClick={changeTitle} />}
    </div>
  );
};

export default LocationStat;

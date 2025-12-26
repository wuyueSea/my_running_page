import { useState, useEffect } from 'react';
import YearStat from '@/components/YearStat';
import useActivities from '@/hooks/useActivities';
import { INFO_MESSAGE } from '@/utils/const';

const YearsStat = ({
  year,
  onClick,
  onClickTypeInYear,
}: {
  year: string;
  onClick: (_year: string) => void;
  onClickTypeInYear: (_year: string, _type: string) => void;
}) => {
  const { years } = useActivities();
  // 核心：直接管理当前显示的年份（放弃复杂页码计算，从根源解决问题）
  const [currentShowYear, setCurrentShowYear] = useState(year);

  // 步骤1：生成完整的年份列表（包含所有年份+Total，去重）
  const yearList = () => {
    // 去重并过滤空值
    const uniqueYears = Array.from(new Set(years)).filter(Boolean);
    // 加入Total，确保不重复
    if (!uniqueYears.includes('Total')) {
      uniqueYears.push('Total');
    }
    return uniqueYears;
  };

  // 步骤2：获取当前年份在列表中的索引（用于分页切换）
  const getCurrentIndex = () => {
    const list = yearList();
    return list.findIndex(item => item === currentShowYear);
  };

  // 步骤3：分页切换方法（直接操作年份，而非页码）
  const handlePrevYear = () => {
    const list = yearList();
    const currentIdx = getCurrentIndex();
    if (currentIdx > 0) {
      const prevYear = list[currentIdx - 1];
      setCurrentShowYear(prevYear);
      onClick(prevYear); // 触发父组件回调
    }
  };

  const handleNextYear = () => {
    const list = yearList();
    const currentIdx = getCurrentIndex();
    if (currentIdx < list.length - 1) {
      const nextYear = list[currentIdx + 1];
      setCurrentShowYear(nextYear);
      onClick(nextYear); // 触发父组件回调
    }
  };

  // 步骤4：下拉框选择年份
  const handleYearSelect = (e) => {
    const selectedYear = e.target.value;
    setCurrentShowYear(selectedYear);
    onClick(selectedYear);
  };

  // 初始化：确保默认显示传入的year
  useEffect(() => {
    setCurrentShowYear(year);
  }, [year]);

  // 无数据兜底
  if (yearList().length === 0) {
    return (
      <div className="w-full pb-16 pr-16 lg:w-full lg:pr-16">
        <p className="leading-relaxed">暂无年份数据</p>
      </div>
    );
  }

  // 计算分页状态（是否可上一页/下一页）
  const canPrev = getCurrentIndex() > 0;
  const canNext = getCurrentIndex() < yearList().length - 1;
  // 计算当前页码（仅用于显示）
  const currentPage = getCurrentIndex() + 1;
  const totalPages = yearList().length;

  return (
    <div className="w-full pb-16 pr-16 lg:w-full lg:pr-16">
      <section className="pb-0">
        <p className="leading-relaxed">
          {INFO_MESSAGE(years.length, year)}
          <br />
        </p>
      </section>
      <hr />

      {/* 下拉框+分页并行，按钮缩小 */}
      <div className="my-4 flex items-center justify-between gap-3">
        {/* 分页控件（缩小按钮） */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            disabled={!canPrev}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black-50 transition-colors text-sm"
          >
            上一年
          </button>
          <span className="text-xs">
            第 {currentPage} 页 / 共 {totalPages} 页
          </span>
          <button
            onClick={handleNextYear}
            disabled={!canNext}
            className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black-50 transition-colors text-sm"
          >
            下一年
          </button>
        </div>

        {/* 年份下拉框 */}
        <select
          value={currentShowYear}
          onChange={handleYearSelect}
          className="px-3 py-1 border rounded hover:bg-[var(--color-years_select)] transition-colors text-sm bg-[var(--color-years_select)]" // 加 bg-white
          // 或浅灰色：bg-gray-50 | 深灰色：bg-gray-800（暗黑模式）
        >
          {yearList().map((item) => (
            <option key={item} value={item}>
              {item === 'Total' ? '全部数据' : `${item}年`}
            </option>
          ))}
        </select>
      </div>

      {/* 显示当前选中的年份数据 */}
      <YearStat
        year={currentShowYear}
        onClick={onClick}
        onClickTypeInYear={onClickTypeInYear}
      />
    </div>
  );
};

export default YearsStat;

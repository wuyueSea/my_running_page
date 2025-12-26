import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

const PeriodStatDetail = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { sortedRunPeriod } = useActivities();

  return (
    <div className="cursor-pointer">
      <section className="grid grid-cols-2 row-gap-1 column-gap-3">
        {/* 注意：map 时不要把索引（index）放到 value 里，只展示 period 本身 */}
        {sortedRunPeriod.map(([period, times]) => (
          <Stat
            key={period}
            value={period} // 仅显示运动项名称（如“跑步机”“厦门市 跑步”），不包含编号
            description={` ${times} 次`} // 次数展示
            citySize={1}
            onClick={() => onClick(period)}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default PeriodStatDetail;

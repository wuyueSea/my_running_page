import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { runPeriod } = useActivities();

  const periodArr = Object.entries(runPeriod);
  periodArr.sort((a, b) => b[1] - a[1]);
  return (
    <div className="cursor-pointer">
      {/* 核心：Grid两列 + 缩小行间距（row-gap-1）+ 适中列间距（column-gap-3） */}
      <section className="grid grid-cols-2 row-gap-1 column-gap-3">
        {periodArr.map(([period, times]) => (
          <Stat
            key={period}
            value={period}
            description={` ${times} 次`}
            citySize={1}
            onClick={() => onClick(period)}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default PeriodStat;

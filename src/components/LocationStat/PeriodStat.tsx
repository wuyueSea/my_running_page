import Stat from '@/components/Stat';
import useActivities from '@/hooks/useActivities';

const PeriodStat = ({ onClick }: { onClick: (_period: string) => void }) => {
  const { runPeriodNoCity } = useActivities();
  const periodArr = Object.entries(runPeriodNoCity);
  periodArr.sort((a, b) => b[1] - a[1]);
  return (
    <div className="cursor-pointer">
      <section>
        {periodArr.map(([periodName, times]) => (
          <Stat
            key={periodName}
            value={`${periodName}`}
            //description={type + (times > 1 ? 's' : '')}
            description={` ${times} 次`}
            citySize={2}
            onClick={() => onClick(periodName)}
          />
        ))}
      </section>
      <hr />
    </div>
  );
};

export default PeriodStat;

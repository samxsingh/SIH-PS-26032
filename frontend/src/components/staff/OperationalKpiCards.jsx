import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Radio,
  CheckCircle2,
  PackageCheck,
  IndianRupee,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export const OperationalKpiCards = ({ stats = {}, onCardClick }) => {
  const { t } = useTranslation();

  const waitingCount = stats.waitingFarmers ?? stats.totalWaiting ?? 0;
  const servingCount = stats.currentlyServing ?? stats.currentlyCalled ?? 0;
  const completedCount = stats.completedToday ?? 0;
  const produceQtl = stats.totalProduceTodayQuintals ?? 184.5;
  const payableRs = stats.estimatedPayableTodayRs ?? 419738;
  const avgTimeMin = stats.averageProcessingMinutes ?? 18;

  const kpis = [
    {
      id: 'WAITING',
      label: t('staff.kpi_waiting_farmers', 'Waiting Farmers'),
      value: `${waitingCount} ${t('staff.unit_farmers', 'Farmers')}`,
      subtext: t('staff.in_line_today', 'In line today'),
      icon: Users,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-400'
    },
    {
      id: 'SERVING',
      label: t('staff.kpi_currently_serving', 'Currently Serving'),
      value: `${servingCount} ${t('staff.unit_farmers', 'Active')}`,
      subtext: t('staff.at_counters', 'At operational counters'),
      icon: Radio,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    {
      id: 'COMPLETED',
      label: t('staff.kpi_completed_today', 'Completed Today'),
      value: `${completedCount} ${t('staff.unit_today', 'Batches')}`,
      subtext: t('staff.procurement_finished', 'Procurement finished'),
      icon: CheckCircle2,
      color: 'text-forest-green',
      bgColor: 'bg-forest-green-light/40',
      borderColor: 'border-forest-green'
    },
    {
      id: 'PRODUCE',
      label: t('staff.kpi_total_produce', 'Total Produce Today'),
      value: `${produceQtl} Qtl`,
      subtext: t('staff.certified_intake', 'Certified net weight'),
      icon: PackageCheck,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-400'
    },
    {
      id: 'PAYABLE',
      label: t('staff.kpi_estimated_payable', 'Estimated Payable'),
      value: `₹${Number(payableRs).toLocaleString('en-IN')}`,
      subtext: t('staff.direct_farmer_credit', 'Direct farmer credit (MSP)'),
      icon: IndianRupee,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-400'
    },
    {
      id: 'TIME',
      label: t('staff.kpi_avg_processing_time', 'Avg Processing Time'),
      value: `${avgTimeMin} min`,
      subtext: t('staff.arrival_to_receipt', 'Arrival to receipt'),
      icon: Clock,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={() => onCardClick && onCardClick(kpi.id)}
            className={`p-3.5 bg-white rounded-xs border-2 border-dark-neutral shadow-brutal-sm transition-all duration-150 ${kpi.bgColor} hover:-translate-y-0.5 cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-dark-neutral-muted truncate block">
                {kpi.label}
              </span>
              <Icon className={`w-4 h-4 ${kpi.color} shrink-0`} />
            </div>

            <div className={`text-xl font-black font-mono tracking-tight ${kpi.color} truncate`}>
              {kpi.value}
            </div>

            <div className="text-[10px] text-dark-neutral-muted font-medium mt-1 truncate">
              {kpi.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalKpiCards;

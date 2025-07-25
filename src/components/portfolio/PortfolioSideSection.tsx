
import PortfolioAllocation from "@/components/portfolio/PortfolioAllocation";
import MonthlyReturns from "@/components/portfolio/MonthlyReturns";
import { AllocationData, PerformanceData } from "@/types/account";

interface PortfolioSideSectionProps {
  totalValue: number;
  dayChange: number;
  dayChangePercentage: number;
  allocationData: AllocationData[];
  performanceData: PerformanceData[];
}

const PortfolioSideSection = ({ 
  totalValue, 
  dayChange, 
  dayChangePercentage, 
  allocationData,
  performanceData
}: PortfolioSideSectionProps) => {
  return (
    <div className="space-y-6">
      <PortfolioAllocation 
        totalValue={totalValue}
        dayChange={dayChange}
        dayChangePercentage={dayChangePercentage}
        allocationData={allocationData}
      />
      
      <MonthlyReturns data={performanceData} />
    </div>
  );
};

export default PortfolioSideSection;

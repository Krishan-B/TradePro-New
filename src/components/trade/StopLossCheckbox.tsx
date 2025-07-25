
import { Checkbox } from "@/components/ui/checkbox";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface StopLossCheckboxProps {
  hasStopLoss: boolean;
  setHasStopLoss: (value: boolean) => void;
  isExecuting: boolean;
}

export const StopLossCheckbox = ({
  hasStopLoss,
  setHasStopLoss,
  isExecuting,
}: StopLossCheckboxProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox 
        id="stopLoss" 
        checked={hasStopLoss} 
        onCheckedChange={() => setHasStopLoss(!hasStopLoss)} 
        disabled={isExecuting}
      />
      <div className="flex items-center">
        <label htmlFor="stopLoss" className="text-sm font-medium cursor-pointer">
          Stop Loss
        </label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 ml-1 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-[200px] text-xs">
                A stop loss order will automatically close your position when the market reaches the specified price, helping to limit potential losses.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

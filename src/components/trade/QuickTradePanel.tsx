
import { useState, useEffect } from 'react';
import { useKycStatus } from '@/hooks/useKycStatus';
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isMarketOpen } from "@/utils/marketHours";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@/hooks/useCombinedMarketData";
import { TradeForm } from "@/components/trade";
import { MarketStatusAlert } from "@/components/trade";
import { getLeverageForAssetType } from "@/utils/leverageUtils";
import { useCombinedMarketData } from "@/hooks/useCombinedMarketData";
import { mockAccountMetrics } from "@/utils/metricUtils";
import { TradeSummary } from "@/components/trade";
import { OrderTypeSelector } from "@/components/trade";
import { UnitsInput } from "@/components/trade";
import { StopLossCheckbox } from "@/components/trade";
import { TakeProfitCheckbox } from "@/components/trade";
import { TradeSlidePanelOptionCheckbox } from "@/components/trade";

interface QuickTradePanelProps {
  asset: Asset;
}

const QuickTradePanel = ({ asset }: QuickTradePanelProps) => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [isExecuting, setIsExecuting] = useState(false);
  const [units, setUnits] = useState("0.01");
  const [orderType, setOrderType] = useState<"market" | "entry">("market");
  const [hasStopLoss, setHasStopLoss] = useState(false);
  const [hasTakeProfit, setHasTakeProfit] = useState(false);
  const [hasExpirationDate, setHasExpirationDate] = useState(false);
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const { toast } = useToast();
  const { status: kycStatus } = useKycStatus();
  
  // Get available funds from account metrics
  const availableFunds = mockAccountMetrics.availableFunds;
  
  // Use our combined market data hook to get data for all market types
  const { marketData, isLoading, refetch } = useCombinedMarketData([asset.market_type], {
    refetchInterval: 2000, // Refresh every 2 seconds for more frequent price updates
  });
  
  // Find the current asset in our market data
  const currentAssetData = marketData.find((item: Asset) => 
    item.symbol === asset.symbol
  );
  
  // Get the current price, defaulting to the passed asset price if not found
  const currentPrice = currentAssetData?.price || asset.price;
  
  // Check if market is open
  const marketIsOpen = isMarketOpen(asset.market_type);
  
  // Get fixed leverage for this asset type
  const fixedLeverage = getLeverageForAssetType(asset.market_type);
  
  // Update buy/sell prices when current price changes
  useEffect(() => {
    setBuyPrice(currentPrice * 1.001); // 0.1% higher
    setSellPrice(currentPrice * 0.999); // 0.1% lower
  }, [currentPrice]);

  // Auto-refresh prices
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Add a small random variation to simulate live price movement
      const variation = Math.random() * 0.002 - 0.001; // -0.1% to +0.1%
      setBuyPrice(prevBuy => prevBuy * (1 + variation));
      setSellPrice(prevSell => prevSell * (1 + variation));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate values based on units
  const parsedUnits = parseFloat(units) || 0;
  const positionValue = currentPrice * parsedUnits;
  const requiredFunds = positionValue / fixedLeverage;
  const fee = requiredFunds * 0.001; // 0.1% fee
  const total = requiredFunds + fee;
  
  // Check if user can afford the trade
  const canAfford = availableFunds >= requiredFunds;

  const handleTabChange = (value: string) => {
    if (value === "buy" || value === "sell") {
      setActiveTab(value);
    }
  };

  const handleSubmit = async (action: "buy" | "sell") => {
    if (kycStatus !== 'approved') {
      toast({
        title: 'KYC Verification Required',
        description: 'Your account must be KYC verified to execute trades. Please complete your KYC verification.',
        variant: 'destructive',
      });
      return;
    }

    if (!marketIsOpen && orderType === "market") {
      toast({
        title: "Market Closed",
        description: "The market is currently closed. Please try again during market hours or use an entry order.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExecuting(true);
    
    try {
      // Simulate network delay for trade execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh market data to get latest price
      await refetch();
      
      toast({
        title: `Order Executed: ${action.toUpperCase()} ${asset.name}`,
        description: `${action.toUpperCase()} order for ${units} units of ${asset.symbol} at $${action === "buy" ? buyPrice.toLocaleString() : sellPrice.toLocaleString()} executed successfully`,
        variant: action === "buy" ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "There was an error executing your trade. Please try again.",
        variant: "destructive",
      });
      console.error("Trade execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Quick Trade</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-muted-foreground">Asset</span>
          <span className="text-sm font-medium">{asset.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Current Price</span>
          <span className="text-sm font-medium">
            ${isLoading ? "Loading..." : currentPrice.toLocaleString()}
          </span>
        </div>
      </div>
      
      {!marketIsOpen && <MarketStatusAlert marketType={asset.market_type} />}
      
      <Tabs defaultValue="buy" onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-4 py-2">
          {/* Real-time Buy Price */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Buy Price</div>
              <div className="text-lg font-medium">${buyPrice.toFixed(4)}</div>
              <Button 
                className="w-full bg-success hover:bg-success/90 text-white"
                onClick={() => handleSubmit("buy")}
                disabled={isExecuting || (orderType === "market" && !marketIsOpen) || !canAfford || parsedUnits <= 0 || kycStatus !== 'approved'}
              >
                {isExecuting && activeTab === "buy" ? "Processing..." : "Buy"}
              </Button>
            </div>
          </div>
          
          {/* Units Input */}
          <UnitsInput
            units={units}
            setUnits={setUnits}
            isExecuting={isExecuting}
            requiredFunds={requiredFunds}
            canAfford={canAfford}
            availableFunds={availableFunds}
          />
          
          {/* Order Type Selection */}
          <OrderTypeSelector
            orderType={orderType}
            onOrderTypeChange={(type) => setOrderType(type as "market" | "entry")}
            disabled={isExecuting}
          />
          
          {/* Order Type Description */}
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
            {orderType === "market" 
              ? "A market order will be executed immediately at the next market price" 
              : "An entry order will be executed when the market reaches the requested price"}
          </div>
          
          {/* Show Entry Rate input if entry order is selected */}
          {orderType === "entry" && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Order rate:</label>
              <div className="flex items-center">
                <button 
                  type="button" 
                  className="px-3 py-2 border border-input bg-background rounded-l-md"
                  onClick={() => {}}
                >
                  -
                </button>
                <input 
                  type="text" 
                  className="flex-1 text-center border-y border-input bg-background py-2"
                  placeholder="Enter rate"
                  defaultValue={currentPrice.toFixed(4)}
                />
                <button 
                  type="button" 
                  className="px-3 py-2 border border-input bg-background rounded-r-md"
                  onClick={() => {}}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rate should be above {(currentPrice * 0.98).toFixed(4)} or below {(currentPrice * 1.02).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Stop Loss Checkbox */}
          <StopLossCheckbox
            hasStopLoss={hasStopLoss}
            setHasStopLoss={setHasStopLoss}
            isExecuting={isExecuting}
          />
          
          {/* Stop Loss Settings */}
          {hasStopLoss && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close rate:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Rate"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close amount:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Amount"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate should be between {(currentPrice * 0.9).toFixed(4)} and {(currentPrice * 0.95).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Take Profit Checkbox */}
          <TakeProfitCheckbox
            hasTakeProfit={hasTakeProfit}
            setHasTakeProfit={setHasTakeProfit}
            isExecuting={isExecuting}
          />
          
          {/* Take Profit Settings */}
          {hasTakeProfit && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close rate:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Rate"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close amount:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Amount"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate should be between {(currentPrice * 1.05).toFixed(4)} and {(currentPrice * 1.1).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Expiration Date Checkbox (only for entry orders) */}
          {orderType === "entry" && (
            <TradeSlidePanelOptionCheckbox
              id="expirationDate"
              label="Expiration Date"
              checked={hasExpirationDate}
              onCheckedChange={() => setHasExpirationDate(!hasExpirationDate)}
              tooltip="Set a date when your entry order should expire if not executed."
              disabled={isExecuting}
            />
          )}

          {/* Expiration Date Settings */}
          {orderType === "entry" && hasExpirationDate && (
            <div className="ml-6">
              <label className="text-sm text-muted-foreground mb-1 block">Expiration:</label>
              <div className="flex items-center">
                <input 
                  type="date" 
                  className="flex-1 border border-input bg-background py-2 px-3 rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The order will expire at the end of the selected date.
              </p>
            </div>
          )}
          
          {/* Trade Summary */}
          <TradeSummary
            currentPrice={currentPrice}
            parsedAmount={requiredFunds}
            fee={fee}
            total={total}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="sell" className="space-y-4 py-2">
          {/* Real-time Sell Price */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Sell Price</div>
              <div className="text-lg font-medium">${sellPrice.toFixed(4)}</div>
              <Button 
                className="w-full bg-warning hover:bg-warning/90 text-white"
                onClick={() => handleSubmit("sell")}
                disabled={isExecuting || (orderType === "market" && !marketIsOpen) || parsedUnits <= 0 || kycStatus !== 'approved'}
              >
                {isExecuting && activeTab === "sell" ? "Processing..." : "Sell"}
              </Button>
            </div>
          </div>
          
          {/* Units Input */}
          <UnitsInput
            units={units}
            setUnits={setUnits}
            isExecuting={isExecuting}
            requiredFunds={requiredFunds}
            canAfford={true} // Always allow selling
            availableFunds={availableFunds}
          />
          
          {/* Order Type Selection */}
          <OrderTypeSelector
            orderType={orderType}
            onOrderTypeChange={(type) => setOrderType(type as "market" | "entry")}
            disabled={isExecuting}
          />
          
          {/* Order Type Description */}
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
            {orderType === "market" 
              ? "A market order will be executed immediately at the next market price" 
              : "An entry order will be executed when the market reaches the requested price"}
          </div>
          
          {/* Show Entry Rate input if entry order is selected */}
          {orderType === "entry" && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Order rate:</label>
              <div className="flex items-center">
                <button 
                  type="button" 
                  className="px-3 py-2 border border-input bg-background rounded-l-md"
                  onClick={() => {}}
                >
                  -
                </button>
                <input 
                  type="text" 
                  className="flex-1 text-center border-y border-input bg-background py-2"
                  placeholder="Enter rate"
                  defaultValue={currentPrice.toFixed(4)}
                />
                <button 
                  type="button" 
                  className="px-3 py-2 border border-input bg-background rounded-r-md"
                  onClick={() => {}}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rate should be above {(currentPrice * 0.98).toFixed(4)} or below {(currentPrice * 1.02).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Stop Loss Checkbox */}
          <StopLossCheckbox
            hasStopLoss={hasStopLoss}
            setHasStopLoss={setHasStopLoss}
            isExecuting={isExecuting}
          />
          
          {/* Stop Loss Settings */}
          {hasStopLoss && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close rate:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Rate"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close amount:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Amount"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate should be between {(currentPrice * 1.05).toFixed(4)} and {(currentPrice * 1.1).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Take Profit Checkbox */}
          <TakeProfitCheckbox
            hasTakeProfit={hasTakeProfit}
            setHasTakeProfit={setHasTakeProfit}
            isExecuting={isExecuting}
          />
          
          {/* Take Profit Settings */}
          {hasTakeProfit && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close rate:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Rate"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Close amount:</label>
                <div className="flex items-center">
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-l-md"
                    onClick={() => {}}
                  >
                    -
                  </button>
                  <input 
                    type="text" 
                    className="flex-1 text-center border-y border-input bg-background py-2"
                    placeholder="Amount"
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 border border-input bg-background rounded-r-md"
                    onClick={() => {}}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate should be between {(currentPrice * 0.9).toFixed(4)} and {(currentPrice * 0.95).toFixed(4)}
              </p>
            </div>
          )}
          
          {/* Expiration Date Checkbox (only for entry orders) */}
          {orderType === "entry" && (
            <TradeSlidePanelOptionCheckbox
              id="expirationDate"
              label="Expiration Date"
              checked={hasExpirationDate}
              onCheckedChange={() => setHasExpirationDate(!hasExpirationDate)}
              tooltip="Set a date when your entry order should expire if not executed."
              disabled={isExecuting}
            />
          )}

          {/* Expiration Date Settings */}
          {orderType === "entry" && hasExpirationDate && (
            <div className="ml-6">
              <label className="text-sm text-muted-foreground mb-1 block">Expiration:</label>
              <div className="flex items-center">
                <input 
                  type="date" 
                  className="flex-1 border border-input bg-background py-2 px-3 rounded-md"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The order will expire at the end of the selected date.
              </p>
            </div>
          )}
          
          {/* Trade Summary */}
          <TradeSummary
            currentPrice={currentPrice}
            parsedAmount={requiredFunds}
            fee={fee}
            total={total}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
      
      <Button variant="outline" className="w-full flex gap-2 mt-2">
        <CreditCard className="w-4 h-4" />
        <span>Deposit Funds</span>
      </Button>
    </div>
  );
};

export default QuickTradePanel;

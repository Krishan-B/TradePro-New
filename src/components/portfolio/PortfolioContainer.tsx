import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import components and hook
import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import PortfolioMetricsCards from "@/components/portfolio/PortfolioMetricsCards";
import PerformanceChart from "@/components/portfolio/PerformanceChart";
import PositionsSection from "@/components/portfolio/PositionsSection";
import PortfolioSideSection from "@/components/portfolio/PortfolioSideSection";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import WinRatePieChart from "@/features/analytics/components/WinRatePieChart";
import PnLChart from "@/features/analytics/components/PnLChart";
import AssetPerformanceList from "@/features/analytics/components/AssetPerformanceList";

const PortfolioContainer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    portfolioData, 
    timeframe, 
    setTimeframe, 
    actions, 
    activeTrades,
    isLoading,
    error,
    refetch
  } = usePortfolioData();
  
  const {
    totalValue,
    cashBalance,
    lockedFunds,
    totalPnL,
    totalPnLPercentage,
    dayChange,
    dayChangePercentage,
    assets,
    closedPositions,
    allocationData,
    performanceData,
    marginLevel,
    equity,
    winRate,
    profitFactor,
    topPerformers,
    worstPerformers,
    pnlHistory,
  } = portfolioData;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-center mb-4">
              You need to sign in to view your portfolio
            </p>
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading portfolio data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Data Retrieval Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error 
                  ? error.message 
                  : "There was a problem loading your portfolio data. Please try again."}
              </AlertDescription>
            </Alert>
            <p className="text-center mb-6 text-muted-foreground">
              This could be due to network connectivity issues or a temporary server problem.
            </p>
            <div className="flex gap-4">
              <Button onClick={refetch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Track and manage your investments
          </p>
        </div>

        {/* Portfolio Summary */}
        <PortfolioSummary 
          balance={cashBalance + lockedFunds}
          equity={cashBalance + lockedFunds + totalValue}
          activeTrades={activeTrades}
          pnl={totalPnL}
          pnlPercentage={totalPnLPercentage}
        />

        {/* Portfolio Metrics Cards */}
        <PortfolioMetricsCards 
          totalValue={totalValue}
          cashBalance={cashBalance}
          lockedFunds={lockedFunds}
          totalPnL={totalPnL}
          totalPnLPercentage={totalPnLPercentage}
          winRate={winRate}
          profitFactor={profitFactor}
          equity={equity}
          marginLevel={marginLevel}
          onExport={actions.handleExportReport}
          onTaxEvents={actions.handleTaxEvents}
        />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
              <div className="lg:col-span-3">
                <PerformanceChart 
                  data={performanceData}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                />
              </div>
              <PortfolioSideSection 
                totalValue={totalValue}
                dayChange={dayChange}
                dayChangePercentage={dayChangePercentage}
                allocationData={allocationData}
                performanceData={performanceData}
              />
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <WinRatePieChart winRate={winRate} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cumulative P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <PnLChart data={pnlHistory} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssetPerformanceList assets={topPerformers} title="Top 5" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Worst Performing Assets</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssetPerformanceList assets={worstPerformers} title="Worst 5" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="positions">
            <div className="mt-6">
              <PositionsSection 
                assets={assets} 
                closedPositions={closedPositions} 
                onViewDetails={actions.handleViewDetails}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PortfolioContainer;

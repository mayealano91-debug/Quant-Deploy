import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';

// Terminal Layout
import TerminalLayout from '@/components/terminal/TerminalLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import MarketsTerminal from '@/pages/MarketsTerminal';
import NewsTerminal from '@/pages/NewsTerminal';
import ResearchTerminal from '@/pages/ResearchTerminal';
import PortfolioTerminal from '@/pages/PortfolioTerminal';
import RiskTerminal from '@/pages/RiskTerminal';
import AIResearchTerminal from '@/pages/AIResearchTerminal';
import QuantLab from '@/pages/QuantLab';
import TradingDesk from '@/pages/TradingDesk';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route element={<TerminalLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<MarketsTerminal />} />
            <Route path="/news" element={<NewsTerminal />} />
            <Route path="/research" element={<ResearchTerminal />} />
            <Route path="/portfolio" element={<PortfolioTerminal />} />
            <Route path="/risk" element={<RiskTerminal />} />
            <Route path="/ai-lab" element={<AIResearchTerminal />} />
            <Route path="/quant" element={<QuantLab />} />
            <Route path="/trading" element={<TradingDesk />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App

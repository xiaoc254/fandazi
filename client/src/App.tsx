import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// 所有 Tab hash（含 lazy / snacks / fruit）都由 Home 内部根据 hash 渲染对应分区，
// 因此 App 级路由把它们一并落到 Home，避免 wouter 把 `/home` 等当作未注册路径而走到 NotFound。
function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/weekly" component={Home} />
      <Route path="/lazy" component={Home} />
      <Route path="/solo" component={Home} />
      <Route path="/health" component={Home} />
      <Route path="/search" component={Home} />
      <Route path="/travel" component={Home} />
      <Route path="/takeout" component={Home} />
      <Route path="/snacks" component={Home} />
      <Route path="/fruit" component={Home} />
      <Route path="/companion" component={Home} />
      <Route path="/hotboard" component={Home} />
      <Route path="/family" component={Home} />
      <Route path="/family-tonight" component={Home} />
      <Route path="/tonight-plan" component={Home} />
      <Route path="/fridge" component={Home} />
      <Route path="/leftover" component={Home} />
      <Route path="/shopping" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

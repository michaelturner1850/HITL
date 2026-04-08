import { Route, Routes } from "react-router-dom";
import { LandingPage } from "@/components/landing/LandingPage";
import { ReviewPage } from "@/components/review/ReviewPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/review/:caseId" element={<ReviewPage />} />
    </Routes>
  );
}

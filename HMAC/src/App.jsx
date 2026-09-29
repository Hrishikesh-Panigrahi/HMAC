import { AnimatePresence, MotionConfig } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { ThemeProvider } from "./theme";
import { useTheme } from "./themeContext";
import Background from "./Components/Background/Background";
import Navbar from "./Components/Navbar/Navbar";
import Student from "./Components/Student/Student";
import TeachersView from "./Pages/Teachersview/TeachersView";
import LoginPage from "./Pages/LoginPage/LoginPage";
import RegistrationPage from "./Pages/RegistrationPage/RegistrationPage";
import SubmissionSummary from "./Pages/SubmissionSummary/SubmissionSummary";
import OcrResultPage from "./Pages/OcrResultPage/OcrResultPage";
import NotFound from "./Pages/NotFound/NotFound";

// Which navbar (if any) each route gets. Auth pages and 404 have none.
const navVariantFor = (pathname) => {
  const path = pathname.toLowerCase();
  if (path === "/student") return "student";
  if (path === "/professor" || path === "/summary" || path.startsWith("/ocrresult/")) return "professor";
  return null;
};

function AnimatedRoutes() {
  const location = useLocation();
  const navVariant = navVariantFor(location.pathname);

  return (
    <>
      {navVariant && <Navbar variant={navVariant} />}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/Student" element={<Student />} />
          <Route path="/Professor" element={<TeachersView />} />
          <Route path="/Summary" element={<SubmissionSummary />} />
          <Route path="/OcrResult/:id" element={<OcrResultPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      closeButton
      offset={84}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "hmac-toast",
          title: "hmac-toast__title",
          description: "hmac-toast__description",
          closeButton: "hmac-toast__close",
          success: "hmac-toast--success",
          error: "hmac-toast--error",
          info: "hmac-toast--info",
        },
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Router>
          <Background />
          <AnimatedRoutes />
          <ThemedToaster />
        </Router>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default App;

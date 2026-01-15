import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/common/Layout";
import PrivateRoute from "./components/common/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardPage from "./pages/DashboardPage";
import Users from "./pages/Users";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Backup from "./pages/Backup";
import Settings from "./pages/Settings";
import WhatsAppPage from "./pages/WhatsAppPage";
import * as Toast from "@radix-ui/react-toast";

function App() {
  return (
    <div className="bg-[#F8F9FD] min-h-screen font-sans text-gray-900">
      <Toast.Provider swipeDirection="right">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/users/:userId"
            element={
              <PrivateRoute>
                <Layout>
                  <UserDetailPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <Layout>
                  <Alerts />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Layout>
                  <Reports />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/backup"
            element={
              <PrivateRoute>
                <Layout>
                  <Backup />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/whatsapp"
            element={
              <PrivateRoute>
                <Layout>
                  <WhatsAppPage />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-[350px] max-w-[100vw] m-0 list-none z-50 outline-none" />
      </Toast.Provider>
    </div>
  );
}

export default App;

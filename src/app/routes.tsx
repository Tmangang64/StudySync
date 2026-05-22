import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { Commit } from "./screens/Commit";
import { CheckIn } from "./screens/CheckIn";
import { Progress } from "./screens/Progress";
import { Recover } from "./screens/Recover";
import { useAppContext } from "./context/AppContext";

import { StudyTools } from "./components/StudyTools";

// Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAppContext();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "home",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "commit",
        element: (
          <ProtectedRoute>
            <Commit />
          </ProtectedRoute>
        ),
      },
      {
        path: "checkin",
        element: (
          <ProtectedRoute>
            <CheckIn />
          </ProtectedRoute>
        ),
      },
      {
        path: "progress",
        element: (
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        ),
      },
      {
        path: "recover",
        element: (
          <ProtectedRoute>
            <Recover />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools",
        element: (
          <ProtectedRoute>
            <StudyTools />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/home" replace />,
      },
    ],
  },
]);

import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CreditSales from "./pages/CreditSales";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Carregando...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Layout>
              <Sales />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/credit-sales"
        element={
          <ProtectedRoute>
            <Layout>
              <CreditSales />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

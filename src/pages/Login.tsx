import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { user, token, setUser, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard if already logged in with token
  useEffect(() => {
    if (!authLoading && user && token) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, token, authLoading, navigate]);

  // Pre-fill email from legacy user data (if exists but no token)
  useEffect(() => {
    if (!authLoading && user && !token && user.email && !email) {
      setEmail(user.email);
    }
  }, [user, token, authLoading, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Login attempt:", { email });
      
      // Use api wrapper for login (no token needed for login endpoint)
      const data = await api.post<{ user: any; token: string }>("/login", { email, password }, { token: null });

      console.log("✅ Login successful:", data.user?.name);

      // Save token and user to context and localStorage
      if (data.user && data.token) {
        setUser(data.user, data.token);
      }

      toast.success(`Welcome back, ${data.user.name || "User"}!`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-primary">Buinsoft</h1>
            <p className="text-sm text-muted-foreground mt-1">Technology Solutions</p>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access the project management platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@buinsoft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

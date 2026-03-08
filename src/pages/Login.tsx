import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { login, seedIfEmpty } from "@/lib/store";
import { GraduationCap } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  seedIfEmpty();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const user = login(email, password);
    if (!user) {
      setError("Invalid credentials. Try teacher@demo.com or alice@demo.com");
      return;
    }
    navigate(user.role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AttendTrack</h1>
          <p className="text-muted-foreground">Student Attendance Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="teacher@demo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="any password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Sign In</Button>
            </form>

            <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
              <p className="font-medium text-secondary-foreground mb-2">Demo Accounts:</p>
              <p className="text-muted-foreground">Teacher: <span className="font-mono text-foreground">teacher@demo.com</span></p>
              <p className="text-muted-foreground">Student: <span className="font-mono text-foreground">alice@demo.com</span></p>
              <p className="text-muted-foreground text-xs mt-1">(any password works)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

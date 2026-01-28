import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminLogin = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Hardcoded credentials
        const validUsers = [
            { user: "Martin", pass: "Dishpet987@$!" },
            { user: "Bananko", pass: "Dishpet987@$!" }
        ];

        const isValid = validUsers.some(u => u.user === username && u.pass === password);

        if (isValid) {
            // Valid login!
            toast.success(`Welcome back, ${username}!`);

            // Create a fake admin user object
            // Use type assertion if necessary, but we modified the interface so it should be fine
            login("fake-admin-token-" + Date.now(), {
                id: 999,
                username: username,
                email: `${username.toLowerCase()}@dispet.fun`,
                role: 'admin'
            });
        } else {
            toast.error("Invalid credentials");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center font-bold text-gray-800">Dišpet Admin</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                            Access Dashboard
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

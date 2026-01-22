import { useEffect, useState } from "react";

import { getCustomers } from "@/integrations/wordpress/woocommerce";
import { WCCustomer } from "@/integrations/wordpress/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MapPin } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Users = () => {
    const [users, setUsers] = useState<WCCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = useState<WCCustomer | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await getCustomers(1, 100);
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({
                    title: "Error",
                    description: "Failed to load users.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-heading">Users</h1>
                <div className="text-sm text-gray-500">
                    Total: {users.length}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.first_name} {user.last_name}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.billing?.city || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    View Details
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>User Details</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xl text-primary">
                                                            {user.first_name[0]}{user.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg">{user.first_name} {user.last_name}</h3>
                                                            <p className="text-sm text-gray-500">Customer ID: #{user.id}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 pt-4 border-t">
                                                        <div className="flex items-center gap-3 text-gray-600">
                                                            <Mail className="w-5 h-5" />
                                                            {user.email}
                                                        </div>
                                                        <div className="flex items-start gap-3 text-gray-600">
                                                            <MapPin className="w-5 h-5 mt-1" />
                                                            <div className="text-sm">
                                                                {user.billing?.address_1},<br />
                                                                {user.billing?.postcode} {user.billing?.city},<br />
                                                                {user.billing?.country}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
};

export default Users;

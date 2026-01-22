import { AdminLayout } from "@/components/admin/AdminLayout";
import { SocialMediaGenerator } from "@/components/admin/social/SocialMediaGenerator";

const Social = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Social Media Studio</h1>
            </div>
            <SocialMediaGenerator />
        </div>
    );
};

export default Social;

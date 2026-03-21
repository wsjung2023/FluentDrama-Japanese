import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";
import { getAdminCopy, getTierLabel } from "@/constants/uiCopy";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlyImageCount: string;
  createdAt: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [newTier, setNewTier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setCurrentPage, uiLanguage } = useAppStore();
  const copy = getAdminCopy(uiLanguage);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: copy.error,
        description: copy.usersLoadFailed,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail) {
      toast({
        title: copy.error,
        description: copy.enterEmail,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("GET", `/api/admin/user/${encodeURIComponent(searchEmail)}`);
      const userData = await response.json();
      setSelectedUser(userData);
      
      toast({
        title: copy.searchCompleted,
        description: copy.userFound(userData.email),
      });
    } catch (error) {
      toast({
        title: copy.error,
        description: copy.userNotFound,
        variant: "destructive",
      });
      setSelectedUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = async () => {
    if (!selectedUser || !newTier) {
      toast({
        title: copy.error,
        description: copy.selectUserAndTier,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("PUT", `/api/admin/user/${selectedUser.id}/subscription`, {
        tier: newTier
      });
      const updatedUser = await response.json();
      
      setSelectedUser(updatedUser);
      toast({
        title: copy.updateCompleted,
        description: copy.updatedSubscription(updatedUser.email, newTier),
      });
    } catch (error) {
      toast({
        title: copy.error,
        description: copy.updateFailed,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserUsage = async () => {
    if (!selectedUser) {
      toast({
        title: copy.error,
        description: copy.selectUser,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("PUT", `/api/admin/user/${selectedUser.id}/reset-usage`);
      const updatedUser = await response.json();
      
      setSelectedUser(updatedUser);
      toast({
        title: copy.resetCompleted,
        description: copy.usageReset(updatedUser.email),
      });
    } catch (error) {
      toast({
        title: copy.error,
        description: copy.resetFailed,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-purple-500">{copy.tierPremium}</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500">{copy.tierPro}</Badge>;
      case 'starter':
        return <Badge className="bg-green-500">{copy.tierStarter}</Badge>;
      default:
        return <Badge variant="secondary">{copy.tierFree}</Badge>;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {copy.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {copy.subtitle}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage('user-home')}
            data-testid="button-back-home"
          >
            {copy.backHome}
          </Button>
        </div>

        {/* User Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{copy.userSearch}</CardTitle>
            <CardDescription>{copy.userSearchDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input 
                placeholder={copy.searchEmailPlaceholder}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                data-testid="input-search-email"
              />
              <Button 
                onClick={searchUser}
                disabled={isLoading}
                data-testid="button-search-user"
              >
                {isLoading ? copy.searching : copy.search}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        {selectedUser && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                {copy.userInfo}
                {getTierBadge(selectedUser.subscriptionTier)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">{copy.basicInfo}</h3>
                  <p><strong>{copy.email}:</strong> {selectedUser.email}</p>
                  <p><strong>{copy.name}:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                  <p><strong>{copy.joinedAt}:</strong> {new Date(selectedUser.createdAt).toLocaleDateString(uiLanguage === 'ko' ? 'ko-KR' : uiLanguage === 'ja' ? 'ja-JP' : 'en-US')}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{copy.subscriptionInfo}</h3>
                  <p><strong>{copy.subscriptionTier}:</strong> {getTierLabel(uiLanguage, selectedUser.subscriptionTier)}</p>
                  <p><strong>{copy.subscriptionStatus}:</strong> {selectedUser.subscriptionStatus}</p>
                  <p><strong>{copy.monthlyImageUsage}:</strong> {selectedUser.monthlyImageCount}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <div className="flex gap-2">
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger className="w-48" data-testid="select-new-tier">
                      <SelectValue placeholder={copy.selectNewTier} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{copy.tierFree}</SelectItem>
                      <SelectItem value="starter">{copy.tierStarter}</SelectItem>
                      <SelectItem value="pro">{copy.tierPro}</SelectItem>
                      <SelectItem value="premium">{copy.tierPremium}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={updateUserSubscription}
                    disabled={isLoading}
                    data-testid="button-update-subscription"
                  >
                    {copy.changeSubscription}
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={resetUserUsage}
                  disabled={isLoading}
                  data-testid="button-reset-usage"
                >
                  {copy.resetUsage}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>{copy.recentUsers}</CardTitle>
            <CardDescription>{copy.recentUsersDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="space-y-4">
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-gray-600">{user.firstName} {user.lastName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTierBadge(user.subscriptionTier)}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchEmail(user.email);
                        }}
                        data-testid={`button-select-user-${user.id}`}
                      >
                        {copy.select}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{copy.noUsers}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

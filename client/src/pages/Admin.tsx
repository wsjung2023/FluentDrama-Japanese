import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppStore } from "@/store/useAppStore";

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
  const { setCurrentPage } = useAppStore();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: "오류",
        description: "사용자 목록을 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUser = async () => {
    if (!searchEmail) {
      toast({
        title: "오류",
        description: "이메일을 입력해주세요.",
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
        title: "검색 완료",
        description: `${userData.email} 사용자를 찾았습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "사용자를 찾을 수 없습니다.",
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
        title: "오류",
        description: "사용자와 새 구독 등급을 선택해주세요.",
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
        title: "업데이트 완료",
        description: `${updatedUser.email}의 구독을 ${newTier}로 변경했습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "구독 업데이트에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserUsage = async () => {
    if (!selectedUser) {
      toast({
        title: "오류",
        description: "사용자를 선택해주세요.",
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
        title: "초기화 완료",
        description: `${updatedUser.email}의 사용량을 초기화했습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "사용량 초기화에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-purple-500">프리미엄</Badge>;
      case 'pro':
        return <Badge className="bg-blue-500">프로</Badge>;
      case 'starter':
        return <Badge className="bg-green-500">스타터</Badge>;
      default:
        return <Badge variant="secondary">무료</Badge>;
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
              관리자 패널 🔧
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              사용자 구독 및 데이터 관리
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage('user-home')}
            data-testid="button-back-home"
          >
            홈으로
          </Button>
        </div>

        {/* User Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>사용자 검색</CardTitle>
            <CardDescription>이메일로 사용자를 검색하고 관리하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input 
                placeholder="사용자 이메일 입력"
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
                {isLoading ? "검색 중..." : "검색"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        {selectedUser && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                사용자 정보
                {getTierBadge(selectedUser.subscriptionTier)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">기본 정보</h3>
                  <p><strong>이메일:</strong> {selectedUser.email}</p>
                  <p><strong>이름:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                  <p><strong>가입일:</strong> {new Date(selectedUser.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">구독 정보</h3>
                  <p><strong>구독 등급:</strong> {selectedUser.subscriptionTier}</p>
                  <p><strong>구독 상태:</strong> {selectedUser.subscriptionStatus}</p>
                  <p><strong>월간 이미지 사용량:</strong> {selectedUser.monthlyImageCount}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <div className="flex gap-2">
                  <Select value={newTier} onValueChange={setNewTier}>
                    <SelectTrigger className="w-48" data-testid="select-new-tier">
                      <SelectValue placeholder="새 구독 등급 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">무료</SelectItem>
                      <SelectItem value="starter">스타터</SelectItem>
                      <SelectItem value="pro">프로</SelectItem>
                      <SelectItem value="premium">프리미엄</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={updateUserSubscription}
                    disabled={isLoading}
                    data-testid="button-update-subscription"
                  >
                    구독 변경
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={resetUserUsage}
                  disabled={isLoading}
                  data-testid="button-reset-usage"
                >
                  사용량 초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>최근 사용자 목록</CardTitle>
            <CardDescription>최근에 가입한 사용자들</CardDescription>
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
                        선택
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">사용자가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
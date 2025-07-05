import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onSuccess: () => void;
}

const API_BASE_URL = 'http://localhost:5000';

export const AuthModal = ({ isOpen, onClose, mode, onSuccess }: AuthModalProps) => {
  const [currentTab, setCurrentTab] = useState(mode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Client-side validation
      if (currentTab === 'register') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "✨ Validation Error",
            description: "Passwords do not match",
            variant: "destructive",
             className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
          });
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          toast({
            title: "✨ Validation Error",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
             className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
          });
          setLoading(false);
          return;
        }
        if (!formData.name.trim()) {
          toast({
            title: "✨ Validation Error",
            description: "Name is required",
            variant: "destructive",
             className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
          });
          setLoading(false);
          return;
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "✨ Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
           className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        });
        setLoading(false);
        return;
      }

      const endpoint = currentTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = currentTab === 'login' 
        ? { email: formData.email.toLowerCase().trim(), password: formData.password }
        : { 
            name: formData.name.trim(), 
            email: formData.email.toLowerCase().trim(), 
            password: formData.password 
          };

      console.log('Making request to:', `${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          toast({
            title: "✨ Authentication Failed",
            description: data.message || "Invalid email or password. Please check your credentials and try again.",
            variant: "destructive",
             className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
          });
        } else if (response.status === 400) {
          toast({
            title: "Invalid Request",
            description: data.message || "Please check your input and try again.",
            variant: "destructive",
          });
        } else if (response.status >= 500) {
          toast({
            title: "Server Error",
            description: "Something went wrong on our end. Please try again later.",
            variant: "destructive",
            className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
          });
        } else {
          toast({
            title: "Error",
            description: data.message || `Request failed with status ${response.status}`,
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      console.log('Response data:', data);

      if (data.success) {
        // Store authentication data (using in-memory storage for Claude.ai compatibility)
        const userData = { token: data.token, user: data.user };
        
        toast({
          title: "✨ Success!",
          description: currentTab === 'login' ? "Welcome back!" : "Account created successfully!",
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      let errorMessage = "Network error. Please try again.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running on port 5000.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Sending password reset request for:', formData.email);

      const response = await fetch(`${API_BASE_URL}/api/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email.toLowerCase().trim() }),
      });

      const responseText = await response.text();
      console.log('Forgot password response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid server response');
      }

      if (data.success) {
        toast({
          title: "✨ Email Sent!",
          description: "Password reset instructions have been sent to your email address.",
          className: "bg-gradient-to-r from-indigo-500 to-pink-500 text-white border-0",
        });
        setShowForgotPassword(false);
        setFormData(prev => ({ ...prev, email: '' }));
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset email. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = "Network error. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setFormData(prev => ({ ...prev, email: '' }));
  };

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-3xl" />
          <div className="relative z-10">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForgotPasswordState}
                  className="p-1 h-8 w-8 text-slate-700 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-slate-800 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Reset Password
                </DialogTitle>
              </div>
            </DialogHeader>
            
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-2xl transform hover:scale-[1.02] transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Forgot Password
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm">
                  Enter your email address and we'll send you a reset link
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-slate-700 text-sm font-medium">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 h-11 rounded-xl transition-all duration-300 hover:bg-white/90"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white/95 to-slate-50/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-3xl" />
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse delay-1000" />
        
        <div className="relative z-10">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-slate-800 font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
              Welcome to SignFlow
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm border-0 rounded-2xl p-1 mb-4 shadow-lg">
              <TabsTrigger 
                value="login" 
                className="text-slate-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl font-medium transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:transform data-[state=active]:scale-[1.02]"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-slate-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-xl font-medium transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:transform data-[state=active]:scale-[1.02]"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-2xl transform hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                    Sign In
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-slate-700 text-sm font-medium">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 h-11 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-700 text-sm font-medium">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-300" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 h-11 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm p-0 h-auto font-medium transition-colors duration-300"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none" 
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-xl rounded-2xl transform hover:scale-[1.01] transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                    Create Account
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-sm">
                    Sign up to start managing your documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-slate-700 text-sm font-medium">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-500 transition-colors duration-300" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Enter your full name"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 h-10 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-slate-700 text-sm font-medium">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-500 transition-colors duration-300" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 h-10 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-slate-700 text-sm font-medium">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-500 transition-colors duration-300" />
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password (min. 6 characters)"
                          className="pl-10 pr-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 h-10 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-300"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="text-slate-700 text-sm font-medium">Confirm Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-500 transition-colors duration-300" />
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10 bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 h-10 rounded-xl transition-all duration-300 hover:bg-white/90"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-300"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-10 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:transform-none" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating account...
                          </div>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
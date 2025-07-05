import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Shield, Users, Zap, ArrowRight, Upload, PenTool, Send, Star, CheckCircle, Globe, Award, Sparkles, Twitter, Linkedin, Github, Mail, Phone, MapPin, Instagram, LogIn, UserPlus } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { AuthModal } from "@/components/AuthModal";
import { Dashboard } from "@/components/Dashboard";



const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const handleAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuth(false);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const navigateTo = (page: string) => {
    setCurrentPage(page);
  };

  // Render different pages based on current page state
  if (currentPage === 'dashboard' && isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  if (currentPage === 'privacy') {
  return (
    <div className="flex items-center space-x-4">
      {/* Enhanced Sign In Button with 3D Effect */}
      <Button 
        variant="ghost" 
        onClick={() => handleAuth('login')} 
        className="group relative text-gray-400 hover:text-white hover:bg-gray-900/50 transition-all duration-300 flex items-center space-x-2 px-6 py-3 rounded-xl overflow-hidden"
      >
        {/* 3D Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* 3D Icon Container */}
        <div className="relative transform group-hover:scale-110 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <LogIn className="w-4 h-4 relative z-10 transform group-hover:rotate-12 transition-transform duration-300" />
          </div>
        </div>
        
        <span className="relative z-10 font-medium">Sign In</span>
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
      </Button>

      {/* Enhanced Get Started Button with 3D Effect */}
      <Button 
        onClick={() => handleAuth('register')}
        className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 px-8 py-3 rounded-xl overflow-hidden"
      >
        {/* Animated background shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        {/* 3D Icon Container */}
        <div className="relative transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <div className="relative w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg border border-white/30 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-pink-400/30 rounded-lg"></div>
            <UserPlus className="w-4 h-4 relative z-10 text-white drop-shadow-sm" />
          </div>
        </div>
        
        <span className="relative z-10 font-semibold ">Get Started</span>
        
        {/* Enhanced sparkle effect */}
        <div className="relative transform group-hover:scale-110 group-hover:rotate-180 transition-all duration-500">
          <Sparkles className="w-4 h-4 text-white/80 drop-shadow-sm" />
        </div>
        
        {/* Pulsing border effect */}
        <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
      </Button>

      {/* Alternative: More Dramatic 3D Get Started Button */}
      <Button 
        onClick={() => handleAuth('register')}
        className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 flex items-center space-x-3 px-10 py-4 rounded-2xl overflow-hidden border border-white/10"
        style={{ display: 'none' }} // Remove this line if you want to use this version instead
      >
        {/* 3D Depth Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 transform translate-y-1 translate-x-1 rounded-2xl"></div>
        
        {/* Main Surface */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl"></div>
        
        {/* Highlight Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
        
        {/* 3D Icon with Floating Effect */}
        <div className="relative transform group-hover:scale-125 group-hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-white rounded-xl blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
          <div className="relative w-10 h-10 bg-gradient-to-br from-white via-cyan-100 to-white rounded-xl border-2 border-white/50 flex items-center justify-center shadow-2xl transform group-hover:rotate-12 transition-all duration-300">
            <div className="absolute inset-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg"></div>
            <UserPlus className="w-5 h-5 relative z-10 text-blue-700 drop-shadow-sm" />
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col">
          <span className="font-bold text-white text-lg drop-shadow-lg">Get Started</span>
          <span className="text-white/80 text-xs">Free Forever</span>
        </div>
        
        {/* Lightning bolt accent */}
        <div className="relative transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
          <Zap className="w-5 h-5 text-yellow-300 drop-shadow-lg animate-pulse" />
        </div>
        
        {/* Outer glow ring */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-300"></div>
      </Button>
    </div>
  );
};

  const features = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Easily upload PDF documents and prepare them for signing with our intuitive interface.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: PenTool,
      title: "Digital Signatures",
      description: "Add legally binding digital signatures with precise positioning and customization.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Send,
      title: "Send for Signing",
      description: "Share documents via secure links and track signature status in real-time.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Bank-level security ensures all signature activities are encrypted, and authenticated.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { number: "50K+", label: "Documents Signed", icon: FileText },
    { number: "99.9%", label: "Uptime Guaranteed", icon: Shield },
    { number: "150+", label: "Countries Served", icon: Globe },
    { number: "5-Star", label: "Customer Rating", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-purple-600/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600/10 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-3000"></div>
        
        {/* Enhanced floating particles */}
        <div className="absolute top-20 left-20 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-40 right-32 w-4 h-4 bg-purple-500 rounded-full animate-ping animation-delay-1000 opacity-60"></div>
        <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-pink-500 rounded-full animate-ping animation-delay-2000 opacity-60"></div>
        <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-cyan-500 rounded-full animate-ping animation-delay-3000 opacity-60"></div>
        <div className="absolute top-1/3 left-10 w-2 h-2 bg-green-500 rounded-full animate-ping animation-delay-1000 opacity-60"></div>
        <div className="absolute top-2/3 right-10 w-1 h-1 bg-yellow-500 rounded-full animate-ping animation-delay-2000 opacity-60"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-lg z-50 border-b border-gray-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-50"></div>
                <AnimatedLogo size={32} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SignFlow
              </span>
              <div className="hidden md:flex items-center ml-4">
                <span className="px-2 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full text-xs text-blue-300 border border-blue-600/30">
                  ✨ New Features
                </span>
              </div>
            </div>
           
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => handleAuth('login')} className="text-gray-400 hover:text-white hover:bg-gray-900/50 transition-all duration-300 flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
              <Button 
                onClick={() => handleAuth('register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Sign Documents{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Digitally
                </span>
                <br />
                <span className="text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  In Seconds
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl">
                The fastest, most secure way to sign and manage documents online. 
                Join thousands of businesses who trust SignFlow for their digital signature needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button 
                  size="lg" 
                  onClick={() => handleAuth('register')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 rounded-xl"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Signing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
              </div>
              
            </div>
            <div className="flex justify-center relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative transform hover:scale-110 transition-transform duration-500">
                  <AnimatedLogo size={320} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative bg-gray-950/70 backdrop-blur-md rounded-2xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 transform group-hover:scale-105">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {stat.number}
                    </div>
                    <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced 3D Cards */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to sign documents
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Powerful features designed to streamline your document signing workflow
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group perspective-1000">
                <Card className="border-0 bg-gray-950/70 backdrop-blur-md shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:-translate-y-4 transform-gpu hover:rotate-y-6 group-hover:scale-105 relative overflow-hidden rounded-3xl">
                  {/* Enhanced glowing border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-sm rounded-3xl`}></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl group-hover:shadow-xl`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                  
                  {/* Enhanced inner glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works with Enhanced 3D Step Cards */}
      <section id="how-it-works" className="py-20 bg-gradient-to-r from-gray-950/70 to-purple-950/50 px-4 sm:px-6 lg:px-8 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How SignFlow Works
            </h2>
            <p className="text-xl text-gray-400">
              Get documents signed in just three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Document",
                description: "Upload your PDF document and add signature fields where needed.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "Send for Signing",
                description: "Share a secure link with signers or sign the document yourself.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Download Signed",
                description: "Get your legally binding signed document with full audit trail.",
                gradient: "from-green-500 to-emerald-500"
              }
            ].map((step, index) => (
              <div key={index} className="text-center group perspective-1000">
                <div className="transform hover:scale-105 transition-all duration-500 hover:rotate-y-12 transform-gpu">
                  <div className={`w-24 h-24 bg-gradient-to-r ${step.gradient} rounded-3xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-2xl group-hover:shadow-purple-500/50 transition-shadow duration-500 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    <span className="relative z-10">{step.step}</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-gray-950/70 backdrop-blur-md rounded-3xl p-12 border border-gray-800/50">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to go paperless?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses who trust SignFlow for their digital signature needs.
              </p>
              <Button 
                size="lg" 
                onClick={() => handleAuth('register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-6 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 rounded-2xl"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-black/95 backdrop-blur-lg text-white py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16 mb-16">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-50"></div>
                  <AnimatedLogo size={40} />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SignFlow</span>
              </div>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Revolutionizing digital signatures with cutting-edge technology. 
                Trusted by businesses worldwide for secure, fast, and legally compliant document signing.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span>hello@signflow.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <Phone className="h-5 w-5 text-purple-400" />
                  <span>+91 7908840378</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <MapPin className="h-5 w-5 text-pink-400" />
                  <span>Kolkata, West Bengal</span>
                </div>
              </div>

              
            </div>

            

{/* Newsletter & Social */}
<div className="md:col-start-3 md:col-span-1 ml-auto max-w-md">
  <h3 className="text-2xl font-bold text-white mb-6">Stay Connected</h3>
  <p className="text-gray-400 mb-6">
    Get the latest updates on new features and industry insights.
  </p>

  {/* Newsletter Signup */}
  <div className="flex space-x-2 mb-8">
    <input 
      type="email" 
      placeholder="Enter your email"
      className="flex-1 px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 rounded-xl">
      Subscribe
    </Button>
  </div>

  {/* Social Media */}
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
    <div className="flex space-x-4">
      <a href="#" className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
        <Twitter className="h-6 w-6 text-white" />
      </a>
      <a href="#" className="w-12 h-12 bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
        <Linkedin className="h-6 w-6 text-white" />
      </a>
      <a href="#" className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-300">
        <Instagram className="h-6 w-6 text-white" />
      </a>
    </div>
  </div>

  {/* Quick Stats */}
  <div className="grid grid-cols-2 gap-4">
    <div className="text-center">
      <div className="text-2xl font-bold text-blue-400">50K+</div>
      <div className="text-gray-500 text-sm">Happy Users</div>
    </div>
    <div className="text-center">
      <div className="text-2xl font-bold text-purple-400">150+</div>
      <div className="text-gray-500 text-sm">Countries</div>
    </div>
  </div>
</div>



          </div>
          
          {/* Enhanced footer bottom */}
          <div className="border-t border-gray-900/50 pt-8">
            <div className="flex flex-col md:flex-row justify-self-center">
              <div className="text-gray-500 mb-4 md:mb-0 text-center md:text-left">
                © 2025 SignFlow. All rights reserved 
                <span className="hidden md:inline"> • Made with ❤️ for digital transformation.</span>
              </div>

            </div>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
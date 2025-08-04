import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStripe } from '@/contexts/StripeContext';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { MultiDatabaseManager } from '@/components/subscription/MultiDatabaseManager';
import { AIFeatures } from '@/components/subscription/AIFeatures';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Database, 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Sparkles,
  Zap,
  Users,
  Palette
} from 'lucide-react';

// Import subscription-related API functions
import { checkSubscriptionStatus } from '@/api/stripe';

export function SettingsPage() {
  const { 
    subscriptionTier, 
    isSubscribed, 
    canUseMultipleDBs, 
    canUseAIFeatures 
  } = useStripe();



  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <SubscriptionStatus />
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="subscription" className="flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Subscription</span>
          </TabsTrigger>
          <TabsTrigger value="databases" className="flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            <span>Databases</span>
          </TabsTrigger>
          <TabsTrigger value="ai-features" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>AI Features</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>Team Access</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>Account</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      {subscriptionTier === 'free' 
                        ? 'Free Plan' 
                        : subscriptionTier === 'pro' 
                          ? 'Pro Plan ($19/month)' 
                          : 'Enterprise Plan ($49/month)'}
                    </p>
                  </div>
                  <Badge variant={subscriptionTier === 'free' ? 'outline' : 'default'}>
                    {subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'pro' ? 'Pro' : 'Enterprise'}
                  </Badge>
                </div>


              </div>
            </CardContent>
          </Card>

          <SubscriptionPlans />
        </TabsContent>

        <TabsContent value="databases" className="space-y-6">
          <MultiDatabaseManager />
        </TabsContent>

        <TabsContent value="ai-features" className="space-y-6">
          <AIFeatures />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Access Management</CardTitle>
              <CardDescription>
                View and manage your team access permissions and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Team Management</h3>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-1.5"
                    onClick={() => window.location.href = '/team'}
                  >
                    <Users className="h-4 w-4" />
                    Manage Team
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create or join teams to collaborate on projects with other users.
                  Team owners can invite members and manage permissions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Project Sharing</h3>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share specific projects with team members and set granular permissions.
                  Control who can view, edit, or administer each project.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Role Management</h3>
                  <Badge variant="outline">Pro+ Feature</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Define custom roles and permission sets for team members.
                  Upgrade to Pro plan to access advanced team features.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">Demo User</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">user@example.com</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Security</h3>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Shield className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Notifications</h3>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Bell className="h-4 w-4" />
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

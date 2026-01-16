import { useState } from "react";
import { 
  CreditCard,
  Check,
  Crown,
  Zap,
  Building,
  Rocket,
  AlertTriangle,
  Download,
  ExternalLink,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import SettingsLayout from "@/components/settings/SettingsLayout";

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: '/mo',
    icon: Zap,
    features: ['25 testimonials', '2 forms', '1 widget', 'Basic analytics'],
    limits: { testimonials: 25, sms: 0, team: 1, widgets: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/mo',
    icon: Rocket,
    features: ['Unlimited testimonials', '100 SMS/mo', '5 team members', '10 widgets', 'Revenue tracking', 'AI content studio'],
    limits: { testimonials: -1, sms: 100, team: 5, widgets: 10 },
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$99',
    period: '/mo',
    icon: Building,
    features: ['Everything in Pro', '500 SMS/mo', 'Unlimited team', 'Custom domain', 'Priority support', 'API access'],
    limits: { testimonials: -1, sms: 500, team: -1, widgets: -1 },
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$249',
    period: '/mo',
    icon: Crown,
    features: ['Everything in Business', 'Unlimited SMS', 'Agency mode', 'White-label', 'Dedicated support', 'Custom integrations'],
    limits: { testimonials: -1, sms: -1, team: -1, widgets: -1 },
  },
];

const invoices = [
  { id: '1', date: 'Jan 1, 2024', amount: '$49.00', status: 'paid' },
  { id: '2', date: 'Dec 1, 2023', amount: '$49.00', status: 'paid' },
  { id: '3', date: 'Nov 1, 2023', amount: '$49.00', status: 'paid' },
  { id: '4', date: 'Oct 1, 2023', amount: '$49.00', status: 'paid' },
];

const SettingsBilling = () => {
  const [currentPlan] = useState('pro');
  const [confirmText, setConfirmText] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Current usage
  const usage = {
    testimonials: { used: 127, limit: -1 },
    sms: { used: 45, limit: 100 },
    team: { used: 3, limit: 5 },
    widgets: { used: 4, limit: 10 },
  };

  const handleUpgrade = (planId: string) => {
    toast.success(`Upgrading to ${planId}...`);
  };

  const handleCancel = () => {
    if (confirmText === 'CANCEL') {
      toast.success("Subscription cancelled. You'll have access until the end of your billing period.");
      setShowCancelDialog(false);
    }
  };

  const handleDelete = () => {
    if (confirmText === 'DELETE ACCOUNT') {
      toast.error("Account deletion initiated...");
      setShowDeleteDialog(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Current Plan */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your subscription and usage</CardDescription>
              </div>
              <Badge className="gradient-sunny text-white text-lg px-4 py-1">Pro Plan</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan Info */}
              <div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2">
                  {plans.find(p => p.id === 'pro')?.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-emerald" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="mt-4">
                  Change Plan
                </Button>
              </div>

              {/* Usage */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground mb-3">Usage This Month</h3>
                {[
                  { label: 'Testimonials', ...usage.testimonials },
                  { label: 'SMS Credits', ...usage.sms },
                  { label: 'Team Members', ...usage.team },
                  { label: 'Widgets', ...usage.widgets },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-muted-foreground">
                        {item.used} / {item.limit === -1 ? '∞' : item.limit}
                      </span>
                    </div>
                    <Progress 
                      value={item.limit === -1 ? 30 : (item.used / item.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Compare Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                return (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      isCurrent 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {plan.popular && (
                      <Badge className="gradient-sunny text-white text-xs mb-2">Most Popular</Badge>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <plan.icon className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold text-foreground">{plan.name}</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-emerald flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrent ? "outline" : "default"}
                      size="sm"
                      className={`w-full ${!isCurrent ? 'gradient-sunny text-white' : ''}`}
                      disabled={isCurrent}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isCurrent ? 'Current Plan' : 'Upgrade'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <div className="font-medium text-foreground">•••• •••• •••• 4242</div>
                  <div className="text-sm text-muted-foreground">Expires 12/2025</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
            <div className="mt-4">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input id="billingEmail" defaultValue="billing@acme.com" className="mt-1 max-w-md" />
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-medium">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald/10 text-emerald">Paid</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
              <div>
                <div className="font-medium text-foreground">Cancel Subscription</div>
                <div className="text-sm text-muted-foreground">You'll lose access to premium features</div>
              </div>
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription?</DialogTitle>
                    <DialogDescription>
                      You'll lose access to premium features at the end of your billing period. Type CANCEL to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type CANCEL to confirm"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                      Keep Subscription
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancel}
                      disabled={confirmText !== 'CANCEL'}
                    >
                      Cancel Subscription
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
              <div>
                <div className="font-medium text-foreground">Delete Account</div>
                <div className="text-sm text-muted-foreground">Permanently delete your account and all data</div>
              </div>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account?</DialogTitle>
                    <DialogDescription>
                      This action is irreversible. All your data, testimonials, and settings will be permanently deleted. Type DELETE ACCOUNT to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE ACCOUNT to confirm"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDelete}
                      disabled={confirmText !== 'DELETE ACCOUNT'}
                    >
                      Delete Forever
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsBilling;

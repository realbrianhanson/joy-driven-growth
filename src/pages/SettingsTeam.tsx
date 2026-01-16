import { useState } from "react";
import { 
  Users,
  Mail,
  Shield,
  Crown,
  User,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import SettingsLayout from "@/components/settings/SettingsLayout";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'John Smith', email: 'john@acme.com', role: 'owner', status: 'active', joinedAt: 'Jan 2024' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@acme.com', role: 'admin', status: 'active', joinedAt: 'Feb 2024' },
  { id: '3', name: 'Mike Johnson', email: 'mike@acme.com', role: 'member', status: 'active', joinedAt: 'Mar 2024' },
  { id: '4', name: 'Emily Davis', email: 'emily@acme.com', role: 'member', status: 'pending', joinedAt: 'Pending' },
];

const roleConfig = {
  owner: { label: 'Owner', emoji: '👑', color: 'bg-gold/10 text-gold border-gold/20' },
  admin: { label: 'Admin', emoji: '🛡️', color: 'bg-primary/10 text-primary border-primary/20' },
  member: { label: 'Member', emoji: '👤', color: 'bg-secondary text-foreground border-border' },
};

const SettingsTeam = () => {
  const [team] = useState<TeamMember[]>(mockTeam);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>("member");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsInviting(true);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    
    setIsInviting(false);
    setInviteEmail("");
    
    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    toast.success(`Invitation sent to ${inviteEmail}! ✉️`);
  };

  const handleRemove = (member: TeamMember) => {
    toast.success(`${member.name} has been removed from the team`);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Invite Member */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Invite Team Member
            </CardTitle>
            <CardDescription>Add new members to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="inviteEmail" className="sr-only">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <span>🛡️</span>
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-muted-foreground">Full access except billing</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-muted-foreground">View and create content</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleInvite} 
                className="gradient-sunny text-white"
                disabled={isInviting}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invite ✉️
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team Members
                </CardTitle>
                <CardDescription>{team.length} members in your organization</CardDescription>
              </div>
              <Badge variant="secondary">{team.filter(m => m.status === 'active').length} active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => {
                  const roleInfo = roleConfig[member.role];
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleInfo.color}>
                          {roleInfo.emoji} {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={member.status === 'active' ? 'bg-emerald text-white' : ''}>
                          {member.status === 'active' ? '🟢 Active' : '🟡 Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.joinedAt}
                      </TableCell>
                      <TableCell>
                        {member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer text-destructive"
                                onClick={() => handleRemove(member)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Role Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(roleConfig).map(([key, config]) => (
                <div key={key} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{config.emoji}</span>
                    <span className="font-semibold text-foreground">{config.label}</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {key === 'owner' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Full access to everything</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Manage billing</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Delete organization</li>
                      </>
                    )}
                    {key === 'admin' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Manage team members</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Manage integrations</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> View analytics</li>
                      </>
                    )}
                    {key === 'member' && (
                      <>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> View testimonials</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Create forms</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald" /> Generate content</li>
                      </>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsTeam;

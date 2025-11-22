import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { TeamMember } from "@/types";
import { useUsers } from "@/contexts/UserContext";
import { generateAvatarInitials } from "@/lib/avatar";

interface TeamMemberFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember;
  onSave: (member: Omit<TeamMember, "id" | "avatar"> & { password?: string; avatar?: string | null }) => void;
}

export const TeamMemberFormModal = ({ open, onOpenChange, member, onSave }: TeamMemberFormModalProps) => {
  const { addUser, updateUser } = useUsers();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    userRole: "User" as "Admin" | "User",
    avatar: null as string | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        password: "",
        role: member.role || "",
        userRole: (member.userRole as "Admin" | "User") || "User",
        avatar: member.avatar || null,
      });
      setErrors({});
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        userRole: "User",
        avatar: null,
      });
      setErrors({});
    }
  }, [member, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!member && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const userData: any = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role.trim() || null,
      userRole: formData.userRole,
      avatar: formData.avatar || null,
    };

    if (member) {
      // Only include password if it's provided
      if (formData.password) {
        userData.password = formData.password;
      }
      updateUser(member.id, userData);
    } else {
      // Password is required for new users
      if (!formData.password) {
        setErrors({ password: "Password is required" });
        return;
      }
      userData.password = formData.password;
      addUser(userData);
    }
    
    onOpenChange(false);
  };

  // Generate avatar initials for preview
  const avatarInitials = generateAvatarInitials(formData.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!member && <span className="text-red-500">*</span>}
              {member && <span className="text-sm text-muted-foreground">(leave empty to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={member ? "Leave empty to keep current" : "Enter password"}
              required={!member}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Job Role (Optional)</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Lead Developer, Senior Developer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userRole">
              Permission Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.userRole}
              onValueChange={(value) => setFormData({ ...formData, userRole: value as "Admin" | "User" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {avatarInitials && (
            <div className="space-y-2">
              <Label>Avatar Preview</Label>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {avatarInitials}
                </div>
                <p className="text-sm text-muted-foreground">
                  Avatar will show initials: {avatarInitials}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto min-h-[44px]">{member ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


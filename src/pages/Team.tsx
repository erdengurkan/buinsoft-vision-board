import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Edit2, Trash2 } from "lucide-react";
import { useUsers } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { TeamMemberFormModal } from "@/components/modals/TeamMemberFormModal";
import { generateAvatarInitials } from "@/lib/avatar";
import { TeamMember } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Team = () => {
  const { users, isLoading, deleteUser } = useUsers();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(undefined);
  
  // Check if current user is Admin
  const isAdmin = currentUser?.userRole === "Admin";

  // Convert users to TeamMember format
  const teamMembers: TeamMember[] = users.map((user) => ({
    id: user.id,
    name: user.name || "",
    email: user.email,
    role: user.role || "",
    userRole: user.userRole,
    avatar: user.avatar || null,
  }));

  // Check if there's an edit query parameter and open modal for current user
  useEffect(() => {
    const editUserId = searchParams.get("edit");
    if (editUserId && currentUser?.id === editUserId) {
      const userToEdit = teamMembers.find((member) => member.id === editUserId);
      if (userToEdit) {
        setEditingMember(userToEdit);
        setIsModalOpen(true);
        // Remove query parameter from URL
        searchParams.delete("edit");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, currentUser, teamMembers, setSearchParams]);

  const handleAddClick = () => {
    setEditingMember(undefined);
    setIsModalOpen(true);
  };

  const handleEditClick = (member: TeamMember) => {
    if (!isAdmin) {
      toast.error("Only Admin users can edit team members");
      return;
    }
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (member: TeamMember) => {
    if (!isAdmin) {
      toast.error("Only Admin users can delete team members");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      deleteUser(member.id);
    }
  };

  const handleSave = (member: Omit<TeamMember, "id" | "avatar"> & { password?: string; avatar?: string | null }) => {
    // The actual save is handled by the modal via UserContext
    setIsModalOpen(false);
    setEditingMember(undefined);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setEditingMember(undefined);
      // Remove edit query parameter if modal is closed
      if (searchParams.get("edit")) {
        searchParams.delete("edit");
        setSearchParams(searchParams, { replace: true });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Meet the talented people behind Buinsoft
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No team members yet. Add your first team member!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => {
            const initials = generateAvatarInitials(member.name);
            const isCurrentUser = currentUser?.id === member.id;
            return (
              <Card 
                key={member.id} 
                className={`hover:shadow-md transition-shadow ${isAdmin ? 'cursor-pointer' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-16 w-16">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{member.name}</CardTitle>
                        <CardDescription>{member.role || "No role"}</CardDescription>
                      </div>
                    </div>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(member)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!isCurrentUser && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(member)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="secondary">
                      {member.userRole === "Admin" ? "Admin" : "User"}
                    </Badge>
                    <Badge variant="outline">Active</Badge>
                    {isCurrentUser && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        You
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TeamMemberFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        member={editingMember}
        onSave={handleSave}
      />
    </div>
  );
};

export default Team;

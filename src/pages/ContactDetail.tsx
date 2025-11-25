import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { contacts } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { ClientProjectSummary } from "@/components/clients/ClientProjectSummary";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ContactDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects } = useApp();
  const { user } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.userRole !== "Admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const contact = contacts.find((c) => c.id === id);

  // Show loading or redirect if not admin
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.userRole !== "Admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Contact not found</h2>
          <Button onClick={() => navigate("/contacts")}>Back to Contacts</Button>
        </div>
      </div>
    );
  }

  // Get all projects for this client
  const clientProjects = projects.filter((p) => p.client === contact.company);

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/contacts")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contacts
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{contact.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {contact.company}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
          <Badge variant="outline" className="mt-2">
            Active Client
          </Badge>
        </CardContent>
      </Card>

      <ClientProjectSummary projects={clientProjects} clientName={contact.company} />
    </div>
  );
};

export default ContactDetail;


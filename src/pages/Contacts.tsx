import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, Plus } from "lucide-react";
import { useCustomers } from "@/contexts/CustomerContext";
import { ContactFormModal } from "@/components/modals/ContactFormModal";
import { Contact } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Contacts = () => {
  const navigate = useNavigate();
  const { customers, isLoading } = useCustomers();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.userRole !== "Admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Convert customers to Contact format
  const contacts: Contact[] = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone,
  }));

  const handleAddClick = () => {
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleSave = (contact: Omit<Contact, "id">) => {
    // The actual save is handled by the modal via CustomerContext
    setIsModalOpen(false);
    setEditingContact(undefined);
  };

  // Show loading or redirect if not admin
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading contacts...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Your business relationships and client contacts
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No contacts yet. Add your first contact!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-xl">{contact.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {contact.company || "No company"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                <Badge variant="outline" className="mt-2">
                  Active Client
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ContactFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        contact={editingContact}
        onSave={handleSave}
      />
    </div>
  );
};

export default Contacts;

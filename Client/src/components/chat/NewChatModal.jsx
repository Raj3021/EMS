import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Users, User } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import { createConversation } from "@/services/chatService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function NewChatModal({ isOpen, onClose, onChatCreated }) {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setSelectedUsers([]);
      setGroupName("");
      setSearchQuery("");
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Assuming employeeService returns { employees: [...] } or just [...]
      // Adjust based on actual API response structure
      const response = await employeeService.getAll();
      
      let data = response;
      // If it's paginated, it might be data.employees or data.data
      if (data.employees) data = data.employees;
      if (data.data) data = data.data;
      
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch employees", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setCreating(true);
      const isGroup = selectedUsers.length > 1;
      
      console.log("DEBUG NewChatModal - Before createConversation:", {
        selectedUsers,
        isGroup,
        groupName,
        nameToSend: isGroup ? groupName : null
      });
      
      const newChat = await createConversation(
        selectedUsers, 
        isGroup, 
        isGroup ? groupName : null
      );

      onChatCreated(newChat);
      onClose();
      toast.success("Chat created successfully");
    } catch (error) {
      console.error("Failed to create chat", error);
      toast.error("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    // Filter out current user and employees without a user account
    if (emp.user_id === currentUser.id || !emp.user_id) return false;
    // Filter by search query
    const fullName = `${emp.first_name} ${emp.last_name || ""}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {selectedUsers.length > 1 && (
            <div className="grid gap-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="border rounded-md">
            <ScrollArea className="h-[300px] p-4">
              {loading ? (
                <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">No users found</div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.user_id || employee.id} // Handle potentially different ID fields
                      className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                      onClick={() => handleUserToggle(employee.user_id || employee.id)} // Prefer user_id for chat logic
                    >
                      <Checkbox
                        checked={selectedUsers.includes(employee.user_id || employee.id)}
                        onCheckedChange={() => handleUserToggle(employee.user_id || employee.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {employee.designation || employee.email}
                        </p>
                      </div>
                      {/* Avatar placeholder */}
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {employee.first_name?.[0]}{employee.last_name?.[0]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
            <span>{selectedUsers.length} selected</span>
            {selectedUsers.length > 1 && <span>Group Chat</span>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreateChat} disabled={selectedUsers.length === 0 || creating}>
            {creating ? "Creating..." : "Start Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

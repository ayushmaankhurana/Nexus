import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSupportIssues } from "@/mocks/data";
import type { SupportIssue } from "@/types";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const cols: DataTableColumn<SupportIssue>[] = [
  { key: "subject", header: "Subject" },
  { key: "category", header: "Category", render: (r) => r.category.replace(/_/g, " ") },
  { key: "priority", header: "Priority", render: (r) => <StatusBadge variant={getStatusVariant(r.priority)}>{r.priority}</StatusBadge> },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
];

export default function StudentSupport() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    toast({ title: "Issue submitted", description: "Your support request has been submitted successfully." });
    setTimeout(() => { setSubmitted(false); setCategory(""); setSubject(""); setDescription(""); }, 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report an Issue" description="Submit a support request or report a concern." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="New Issue">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance_mismatch">Attendance Mismatch</SelectItem>
                  <SelectItem value="denied_access">Denied Access</SelectItem>
                  <SelectItem value="account_lock">Account Lock</SelectItem>
                  <SelectItem value="lost_device">Lost Phone / Card</SelectItem>
                  <SelectItem value="emergency">Emergency Concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Brief summary of the issue" value={subject} onChange={e => setSubject(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the issue in detail..." rows={4} value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting || submitted} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitted && <CheckCircle className="h-4 w-4" />}
              {submitted ? "Submitted!" : "Submit Issue"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="My Support History">
          <DataTable columns={cols} data={mockSupportIssues} emptyTitle="No issues submitted" emptyDescription="You haven't reported any issues yet." />
        </SectionCard>
      </div>
    </div>
  );
}

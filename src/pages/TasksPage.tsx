import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Send } from "lucide-react";
import { mockTasks, mockTaskCompletions } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TasksPage() {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null);
  const [proofUrl, setProofUrl] = useState("");

  const completedIds = mockTaskCompletions.map((c) => c.taskId);
  const availableTasks = mockTasks.filter((t) => !completedIds.includes(t.id));
  const pendingCompletions = mockTaskCompletions.filter((c) => c.status === "pending");
  const approvedCompletions = mockTaskCompletions.filter((c) => c.status === "approved");
  const rejectedCompletions = mockTaskCompletions.filter((c) => c.status === "rejected");

  const handleSubmit = () => {
    if (!proofUrl) {
      toast.error("Please provide proof");
      return;
    }
    toast.success("Task submitted for review!");
    setSubmitDialogOpen(false);
    setProofUrl("");
  };

  const difficultyColor = (d: string) => {
    if (d === "Easy") return "bg-success/10 text-success";
    if (d === "Medium") return "bg-warning/10 text-warning";
    return "bg-destructive/10 text-destructive";
  };

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold">{task.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
        </div>
        <span className="font-mono-amount glow-text text-lg">${task.rewardAmount.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Badge variant="secondary" className="text-xs">{task.platform}</Badge>
        <Badge variant="secondary" className="text-xs">{task.category}</Badge>
        <Badge className={`text-xs ${difficultyColor(task.difficulty)}`}>{task.difficulty}</Badge>
      </div>
      <div className="flex gap-2">
        {task.link && (
          <Button variant="outline" size="sm" asChild>
            <a href={task.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Visit
            </a>
          </Button>
        )}
        <Button
          size="sm"
          className="gradient-primary text-primary-foreground"
          onClick={() => { setSelectedTask(task); setSubmitDialogOpen(true); }}
        >
          <Send className="h-3 w-3 mr-1" /> Submit Proof
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="page-container">
      <h1 className="page-title mb-6">Tasks</h1>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="glass-card mb-6">
          <TabsTrigger value="available">Available ({availableTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCompletions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({approvedCompletions.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCompletions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid gap-4 md:grid-cols-2">
            {availableTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          {pendingCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending submissions</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingCompletions.map((c) => {
                const task = mockTasks.find((t) => t.id === c.taskId);
                return task ? (
                  <div key={c.id} className="glass-card p-5">
                    <h3 className="font-display font-semibold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Submitted: {c.submittedAt}</p>
                    <Badge variant="secondary" className="mt-2">Pending Review</Badge>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {approvedCompletions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No completed tasks</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedCompletions.map((c) => {
                const task = mockTasks.find((t) => t.id === c.taskId);
                return task ? (
                  <div key={c.id} className="glass-card p-5">
                    <h3 className="font-display font-semibold">{task.title}</h3>
                    <span className="font-mono-amount glow-text">${task.rewardAmount.toFixed(2)}</span>
                    <Badge className="ml-2 bg-success/10 text-success">Approved</Badge>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <p className="text-muted-foreground text-center py-8">No rejected submissions</p>
        </TabsContent>
      </Tabs>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Submit Proof — {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Proof URL or description</Label>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://twitter.com/yourpost..."
              className="bg-secondary border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

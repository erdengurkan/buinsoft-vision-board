export const getDeadlineStatus = (deadline?: Date): "overdue" | "soon" | "normal" | "none" => {
  if (!deadline) return "none";
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "normal";
};

export const getDeadlineColor = (status: "overdue" | "soon" | "normal" | "none"): string => {
  switch (status) {
    case "overdue":
      return "border-red-500 border-2";
    case "soon":
      return "border-orange-500 border-2";
    default:
      return "";
  }
};

export const hasFollowUpNeeded = (tasks: any[]): boolean => {
  return tasks.some((task) => {
    if (!task.followUp) return false;
    if (!task.deadline) return task.followUp;
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    return deadline <= now;
  });
};

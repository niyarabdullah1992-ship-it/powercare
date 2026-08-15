import { Navigate } from "react-router-dom";

/** Old PowerCare tasks board — always use Operations. */
export default function MyTasks() {
  return <Navigate to="/app/tasks" replace />;
}
